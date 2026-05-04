/**
 * jax-handler.mts
 *
 * Main Jax AI chat handler — streaming OpenAI gpt-4o with function calling,
 * role-gated tools, per-user rate limiting, and full audit logging.
 *
 * POST /netlify/functions/jax-handler
 * Body: { messages, role, userId, currentPage, tools_enabled? }
 */

import type { Context } from "@netlify/functions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface JaxRequestBody {
  messages: OpenAIMessage[];
  role: UserRole;
  userId: string;
  currentPage?: string;
  tools_enabled?: string[];
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: OpenAIToolCall[];
}

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIChunk {
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: string | null;
  }>;
}

type UserRole = "sysadmin" | "admin" | "staff" | "field_agent";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_ROLES: UserRole[] = ["sysadmin", "admin", "staff", "field_agent"];
const RATE_LIMIT_MAX = 30;            // messages per user per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
// NOTE: In-memory rate limiting is best-effort in serverless — each function
// instance keeps its own Map. For strict enforcement use a shared store (Redis/Supabase).
const MAX_TOOL_ITERATIONS = 5; // max agentic loop iterations per request

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Rate limiter (in-memory) ─────────────────────────────────────────────────

interface RateBucket { count: number; resetAt: number }
const rateLimiter = new Map<string, RateBucket>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateLimiter.get(userId);
  if (!bucket || now >= bucket.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function getEnv(key: string): string {
  return (
    (typeof Netlify !== "undefined" && Netlify.env?.get(key)) ||
    process.env[key] ||
    ""
  );
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────

function supabaseHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function sbSelect(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  query: string,
): Promise<unknown[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: supabaseHeaders(serviceKey),
  });
  if (!res.ok) return [];
  return res.json() as Promise<unknown[]>;
}

async function sbInsert(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

async function sbUpdate(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  query: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Audit logging ────────────────────────────────────────────────────────────

async function logAudit(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  action: string,
  details: Record<string, unknown>,
) {
  try {
    await sbInsert(supabaseUrl, serviceKey, "audit_logs_1777090020", {
      user_id: userId,
      action,
      details,
      source: "jax",
      created_at: new Date().toISOString(),
    });
  } catch {
    // audit failures must never interrupt the main flow
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(role: UserRole, currentPage?: string): string {
  const now = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });
  return `You are Jax, the AI assistant for Acute Connect — a mental health and disability support platform operating in Australia.

Current time (AEST): ${now}
User role: ${role}
Current page: ${currentPage ?? "unknown"}

## Your purpose
You help ${role} users with:
- Clinical decision support (triage, escalation, care planning)
- Client management (searching records, updating notes, reviewing alerts)
- Scheduling and appointment coordination
- Document generation (progress notes, referrals, discharge summaries, care plans)
- Platform navigation and workflow guidance
- Incident reporting and crisis response

## Australian context
You are familiar with NDIS, Medicare, AHPRA, the Mental Health Act (Vic), My Health Record, SafeScript, and Australian clinical terminology.

## Behaviour guidelines
- Be concise, professional, and clinically appropriate
- Prioritise client safety — always escalate crisis indicators
- When uncertain about clinical information, recommend consulting a clinician
- Protect client privacy: never repeat PII unnecessarily in your responses
- If you receive tool results, interpret them helpfully for the user
- Confirm destructive actions (e.g., deleting data) before executing

## Role limitations
${role === "field_agent" ? "- You cannot access system health checks or audit logs\n- Focus on field visit support and client check-ins" : ""}
${role === "staff" ? "- You cannot access system health checks, audit logs, or provider applications" : ""}
${role === "admin" ? "- You have access to provider applications and audit logs, but not system health checks" : ""}
${role === "sysadmin" ? "- You have full access to all platform tools and system diagnostics" : ""}

Respond in plain language. When using tools, explain what you are doing.`;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

function buildToolDefinitions(role: UserRole) {
  const allTools = [
    {
      type: "function",
      function: {
        name: "query_clients",
        description: "Search for clients by name, CRN, or other criteria",
        parameters: {
          type: "object",
          properties: {
            search: { type: "string", description: "Name, CRN, or keyword to search" },
            limit: { type: "number", description: "Max results (default 10)" },
          },
          required: ["search"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_client_detail",
        description: "Get full details for a specific client by ID or CRN",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string", description: "Client UUID or CRN" },
          },
          required: ["clientId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_clinical_notes",
        description: "Append a clinical note to a client's record",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            note: { type: "string", description: "The clinical note text" },
            noteType: { type: "string", description: "e.g. progress_note, risk_assessment" },
          },
          required: ["clientId", "note"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_alerts",
        description: "List active crisis alerts, optionally filtered by severity or client",
        parameters: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            clientId: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "resolve_alert",
        description: "Mark a crisis alert as resolved",
        parameters: {
          type: "object",
          properties: {
            alertId: { type: "string" },
            resolution: { type: "string", description: "Resolution notes" },
          },
          required: ["alertId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_alert",
        description: "Create a new crisis alert for a client",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            description: { type: "string" },
          },
          required: ["clientId", "severity", "description"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_appointments",
        description: "List appointments for today or a date range",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "ISO date (YYYY-MM-DD), defaults to today" },
            clientId: { type: "string" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_appointment",
        description: "Schedule a new appointment",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            staffId: { type: "string" },
            dateTime: { type: "string", description: "ISO datetime" },
            type: { type: "string" },
            notes: { type: "string" },
          },
          required: ["clientId", "dateTime", "type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "fill_form",
        description: "Pre-fill a platform form with given data",
        parameters: {
          type: "object",
          properties: {
            formId: { type: "string" },
            data: { type: "object", description: "Field values to pre-fill" },
          },
          required: ["formId", "data"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "submit_form",
        description: "Submit a platform form with given data",
        parameters: {
          type: "object",
          properties: {
            formId: { type: "string" },
            data: { type: "object" },
          },
          required: ["formId", "data"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_document",
        description: "Generate a clinical or administrative document",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["progress_note", "referral", "discharge_summary", "care_plan", "report", "letter"],
            },
            clientName: { type: "string" },
            context: { type: "string", description: "Clinical context or instructions" },
          },
          required: ["type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "save_document",
        description: "Save a generated document to the platform",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string" },
            content: { type: "string" },
            clientId: { type: "string" },
          },
          required: ["title", "type", "content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "notify_staff",
        description: "Send an in-platform notification to a staff member or group",
        parameters: {
          type: "object",
          properties: {
            recipientRole: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            urgency: { type: "string", enum: ["info", "warning", "critical"] },
          },
          required: ["title", "message"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_platform_stats",
        description: "Get platform-wide statistics (active clients, alerts, appointments)",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "get_todays_schedule",
        description: "Get today's schedule for the current user",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "navigate_to",
        description: "Navigate the user to a specific platform page",
        parameters: {
          type: "object",
          properties: {
            route: { type: "string", description: "e.g. /admin/clients or /dashboard" },
            params: { type: "object" },
          },
          required: ["route"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "log_field_visit",
        description: "Log a field visit or outreach activity",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            location: { type: "string" },
            notes: { type: "string" },
            outcome: { type: "string" },
          },
          required: ["clientId", "notes"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "report_incident",
        description: "Report a safety or clinical incident",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            incidentType: { type: "string" },
            description: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          },
          required: ["incidentType", "description", "severity"],
        },
      },
    },
    // Role-gated tools — included conditionally below
    {
      type: "function",
      function: {
        name: "get_provider_applications",
        description: "List pending provider/organisation applications",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_audit_log",
        description: "Query the platform audit log",
        parameters: {
          type: "object",
          properties: {
            userId: { type: "string" },
            action: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "run_db_health_check",
        description: "Run a database and platform health check (sysadmin only)",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  // Filter tools by role
  return allTools.filter((tool) => {
    const name = tool.function.name;
    if (name === "run_db_health_check") return role === "sysadmin";
    if (name === "get_provider_applications" || name === "get_audit_log")
      return role === "sysadmin" || role === "admin";
    return true;
  });
}

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { supabaseUrl: string; serviceKey: string; userId: string; role: UserRole },
): Promise<unknown> {
  const { supabaseUrl, serviceKey, userId, role } = ctx;

  switch (name) {
    case "query_clients": {
      const search = String(args.search ?? "");
      const limit = Number(args.limit ?? 10);
      const data = await sbSelect(
        supabaseUrl,
        serviceKey,
        "clients_1777020684735",
        `or=(full_name.ilike.*${encodeURIComponent(search)}*,crn.ilike.*${encodeURIComponent(search)}*)&limit=${limit}&select=id,crn,full_name,date_of_birth,status,location_id`,
      );
      return { clients: data, count: (data as unknown[]).length };
    }

    case "get_client_detail": {
      const clientId = String(args.clientId ?? "");
      const isUuid = /^[0-9a-f-]{36}$/.test(clientId);
      const query = isUuid
        ? `id=eq.${clientId}`
        : `crn=eq.${encodeURIComponent(clientId)}`;
      const data = await sbSelect(supabaseUrl, serviceKey, "clients_1777020684735", query);
      return (data as unknown[])[0] ?? { error: "Client not found" };
    }

    case "update_clinical_notes": {
      const clientId = String(args.clientId ?? "");
      const note = String(args.note ?? "");
      const noteType = String(args.noteType ?? "progress_note");
      // Fetch existing notes, append new one
      const existing = await sbSelect(
        supabaseUrl,
        serviceKey,
        "clients_1777020684735",
        `id=eq.${clientId}&select=clinical_notes`,
      ) as Array<{ clinical_notes?: unknown[] }>;
      const currentNotes: unknown[] = (existing[0]?.clinical_notes as unknown[]) ?? [];
      const newNote = {
        id: crypto.randomUUID(),
        type: noteType,
        content: note,
        author_id: userId,
        created_at: new Date().toISOString(),
      };
      await sbUpdate(
        supabaseUrl,
        serviceKey,
        "clients_1777020684735",
        `id=eq.${clientId}`,
        { clinical_notes: [...currentNotes, newNote] },
      );
      return { success: true, noteId: newNote.id };
    }

    case "get_alerts": {
      const params: string[] = ["select=id,severity,description,client_id,created_at,resolved"];
      if (args.severity) params.push(`severity=eq.${args.severity}`);
      if (args.clientId) params.push(`client_id=eq.${args.clientId}`);
      params.push(`resolved=eq.false`);
      params.push(`limit=${args.limit ?? 20}`);
      const data = await sbSelect(supabaseUrl, serviceKey, "crisis_events_1777090008", params.join("&"));
      return { alerts: data };
    }

    case "resolve_alert": {
      const alertId = String(args.alertId ?? "");
      await sbUpdate(supabaseUrl, serviceKey, "crisis_events_1777090008", `id=eq.${alertId}`, {
        resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: args.resolution ?? "",
      });
      await logAudit(supabaseUrl, serviceKey, userId, "jax_resolve_alert", { alertId });
      return { success: true };
    }

    case "create_alert": {
      const alert = await sbInsert(supabaseUrl, serviceKey, "crisis_events_1777090008", {
        client_id: args.clientId,
        severity: args.severity,
        description: args.description,
        resolved: false,
        created_by: userId,
        created_at: new Date().toISOString(),
      });
      await logAudit(supabaseUrl, serviceKey, userId, "jax_create_alert", { args });
      return { success: true, alert };
    }

    case "get_appointments": {
      const date = String(args.date ?? new Date().toISOString().split("T")[0]);
      const params: string[] = [
        `select=id,client_id,staff_id,appointment_type,scheduled_at,status,notes`,
        `scheduled_at=gte.${date}T00:00:00`,
        `scheduled_at=lte.${date}T23:59:59`,
        `order=scheduled_at.asc`,
      ];
      if (args.clientId) params.push(`client_id=eq.${args.clientId}`);
      const data = await sbSelect(supabaseUrl, serviceKey, "appointments", params.join("&")).catch(() => []);
      return { appointments: data };
    }

    case "create_appointment": {
      const appt = await sbInsert(supabaseUrl, serviceKey, "appointments", {
        client_id: args.clientId,
        staff_id: args.staffId ?? userId,
        appointment_type: args.type,
        scheduled_at: args.dateTime,
        notes: args.notes ?? "",
        status: "scheduled",
        created_by: userId,
        created_at: new Date().toISOString(),
      }).catch(() => null);
      await logAudit(supabaseUrl, serviceKey, userId, "jax_create_appointment", { args });
      return { success: !!appt, appointment: appt };
    }

    case "fill_form": {
      // Returns instructions for the frontend to pre-fill a form
      return { action: "fill_form", formId: args.formId, data: args.data };
    }

    case "submit_form": {
      // Look up form registry to determine target table and allowed fields
      const registry = await sbSelect(
        supabaseUrl,
        serviceKey,
        "jax_form_registry",
        `form_id=eq.${args.formId}&select=supabase_table,fields`,
      ) as Array<{ supabase_table?: string; fields?: Record<string, unknown> }>;
      const tableName = registry[0]?.supabase_table;
      if (!tableName) return { error: "Form not found in registry" };

      // Validate submitted data against the registered field schema (allowlist)
      const allowedFields = registry[0]?.fields
        ? Object.keys(registry[0].fields)
        : null;
      const rawData = (args.data ?? {}) as Record<string, unknown>;
      const safeData: Record<string, unknown> = allowedFields
        ? Object.fromEntries(
            Object.entries(rawData).filter(([k]) => allowedFields.includes(k)),
          )
        : rawData;

      const result = await sbInsert(supabaseUrl, serviceKey, tableName, {
        ...safeData,
        submitted_by: userId,
        created_at: new Date().toISOString(),
      });
      await logAudit(supabaseUrl, serviceKey, userId, "jax_submit_form", { formId: args.formId });
      return { success: true, result };
    }

    case "generate_document": {
      // Delegate to jax-document function
      return {
        action: "generate_document",
        type: args.type,
        clientName: args.clientName,
        context: args.context,
        message: "Document generation initiated. Use the document panel to view results.",
      };
    }

    case "save_document": {
      const doc = await sbInsert(supabaseUrl, serviceKey, "jax_documents", {
        name: args.title,
        type: args.type,
        content: args.content as string,
        client_id: args.clientId ?? null,
        created_by: userId,
        jax_generated: true,
        requires_review: true,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await logAudit(supabaseUrl, serviceKey, userId, "jax_save_document", { title: args.title, type: args.type });
      return { success: true, document: doc };
    }

    case "notify_staff": {
      await sbInsert(supabaseUrl, serviceKey, "jax_notifications", {
        recipient_role: args.recipientRole ?? role,
        title: args.title,
        message: args.message,
        urgency: args.urgency ?? "info",
        created_at: new Date().toISOString(),
      });
      return { success: true };
    }

    case "get_platform_stats": {
      const [clients, alerts] = await Promise.all([
        sbSelect(supabaseUrl, serviceKey, "clients_1777020684735", "select=id&limit=1&offset=0"),
        sbSelect(supabaseUrl, serviceKey, "crisis_events_1777090008", "resolved=eq.false&select=id"),
      ]);
      return {
        activeAlerts: (alerts as unknown[]).length,
        note: "Full stats available on the dashboard",
      };
    }

    case "get_todays_schedule": {
      const today = new Date().toISOString().split("T")[0];
      const data = await sbSelect(
        supabaseUrl,
        serviceKey,
        "appointments",
        `staff_id=eq.${userId}&scheduled_at=gte.${today}T00:00:00&scheduled_at=lte.${today}T23:59:59&order=scheduled_at.asc`,
      ).catch(() => []);
      return { schedule: data, date: today };
    }

    case "navigate_to": {
      return { action: "navigate", route: args.route, params: args.params ?? {} };
    }

    case "log_field_visit": {
      const visit = await sbInsert(supabaseUrl, serviceKey, "field_visits", {
        client_id: args.clientId,
        staff_id: userId,
        location: args.location ?? "",
        notes: args.notes,
        outcome: args.outcome ?? "",
        visited_at: new Date().toISOString(),
      }).catch(() => null);
      await logAudit(supabaseUrl, serviceKey, userId, "jax_log_field_visit", { clientId: args.clientId });
      return { success: true, visit };
    }

    case "report_incident": {
      const incident = await sbInsert(supabaseUrl, serviceKey, "incidents", {
        client_id: args.clientId ?? null,
        incident_type: args.incidentType,
        description: args.description,
        severity: args.severity,
        reported_by: userId,
        reported_at: new Date().toISOString(),
        status: "open",
      }).catch(() => null);
      await logAudit(supabaseUrl, serviceKey, userId, "jax_report_incident", { args });
      return { success: true, incident };
    }

    case "get_provider_applications": {
      if (role !== "sysadmin" && role !== "admin") return { error: "Forbidden" };
      const status = String(args.status ?? "pending");
      const data = await sbSelect(
        supabaseUrl,
        serviceKey,
        "providers_1740395000",
        `status=eq.${status}&select=id,org_name,contact_name,email,created_at,status`,
      );
      return { applications: data };
    }

    case "get_audit_log": {
      if (role !== "sysadmin" && role !== "admin") return { error: "Forbidden" };
      const params: string[] = [
        "select=id,user_id,action,details,source,created_at",
        `limit=${args.limit ?? 50}`,
        "order=created_at.desc",
      ];
      if (args.userId) params.push(`user_id=eq.${args.userId}`);
      if (args.action) params.push(`action=ilike.*${args.action}*`);
      const data = await sbSelect(supabaseUrl, serviceKey, "audit_logs_1777090020", params.join("&"));
      return { logs: data };
    }

    case "run_db_health_check": {
      if (role !== "sysadmin") return { error: "Forbidden" };
      // Check connectivity to key tables
      const tables = [
        "clients_1777020684735",
        "crisis_events_1777090008",
        "audit_logs_1777090020",
        "jax_documents",
        "jax_notifications",
      ];
      const results: Record<string, string> = {};
      await Promise.all(
        tables.map(async (t) => {
          try {
            await sbSelect(supabaseUrl, serviceKey, t, "select=id&limit=1");
            results[t] = "ok";
          } catch {
            results[t] = "error";
          }
        }),
      );
      return { health: results, checkedAt: new Date().toISOString() };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async (req: Request, _context: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  // Parse body
  let body: JaxRequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { messages, role, userId, currentPage, tools_enabled } = body;

  // Validate role
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return json({ error: "Forbidden: invalid role" }, 403);
  }

  if (!userId) {
    return json({ error: "userId is required" }, 400);
  }

  // Rate limit
  if (!checkRateLimit(userId)) {
    return json({ error: "Rate limit exceeded. Try again later." }, 429);
  }

  // Env vars
  const openaiKey = getEnv("OPENAI_API_KEY");
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!openaiKey) {
    return json({ error: "AI service unavailable" }, 503);
  }

  const supaCfg = { supabaseUrl, serviceKey, userId, role };

  // Build messages array with system prompt
  const systemMessage: OpenAIMessage = {
    role: "system",
    content: buildSystemPrompt(role, currentPage),
  };
  const allMessages: OpenAIMessage[] = [systemMessage, ...(messages ?? [])];

  // Build tool list (optionally filtered by tools_enabled)
  let tools = buildToolDefinitions(role);
  if (tools_enabled && tools_enabled.length > 0) {
    tools = tools.filter((t) => tools_enabled.includes(t.function.name));
  }

  // Log the conversation start
  logAudit(supabaseUrl, serviceKey, userId, "jax_chat", {
    role,
    currentPage,
    messageCount: allMessages.length,
  });

  // Streaming response via ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        // Agentic loop: call OpenAI, handle tool calls, repeat if needed
        let loopMessages = [...allMessages];
        let iterations = 0;

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;

          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: loopMessages,
              tools,
              tool_choice: "auto",
              stream: true,
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          if (!openaiRes.ok) {
            const errText = await openaiRes.text();
            send(JSON.stringify({ error: `OpenAI error: ${openaiRes.status}` }));
            controller.close();
            return;
          }

          // Read the SSE stream from OpenAI
          const reader = openaiRes.body?.getReader();
          if (!reader) {
            send(JSON.stringify({ error: "No response body from OpenAI" }));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let finishReason: string | null = null;

          // Accumulate tool calls across chunks
          const toolCallAccumulator: Record<number, {
            id: string;
            name: string;
            arguments: string;
          }> = {};

          // Accumulate assistant text for adding to messages
          let assistantContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") { finishReason = finishReason ?? "stop"; continue; }

              try {
                const chunk = JSON.parse(raw) as OpenAIChunk;
                const choice = chunk.choices?.[0];
                if (!choice) continue;

                if (choice.finish_reason) finishReason = choice.finish_reason;

                const delta = choice.delta;

                // Stream text content directly to client
                if (delta.content) {
                  assistantContent += delta.content;
                  send(JSON.stringify({ delta: delta.content }));
                }

                // Accumulate tool call fragments
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    if (!toolCallAccumulator[tc.index]) {
                      toolCallAccumulator[tc.index] = { id: "", name: "", arguments: "" };
                    }
                    if (tc.id) toolCallAccumulator[tc.index].id = tc.id;
                    if (tc.function?.name) toolCallAccumulator[tc.index].name += tc.function.name;
                    if (tc.function?.arguments) toolCallAccumulator[tc.index].arguments += tc.function.arguments;
                  }
                }
              } catch {
                // ignore malformed SSE chunks
              }
            }
          }

          // If no tool calls, we're done
          if (finishReason !== "tool_calls" || Object.keys(toolCallAccumulator).length === 0) {
            break;
          }

          // Execute all tool calls and add results to messages
          const toolCallMessages: OpenAIMessage[] = [];
          const assistantToolCalls: OpenAIToolCall[] = Object.values(toolCallAccumulator).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          }));

          // Add assistant message with tool_calls
          loopMessages.push({
            role: "assistant",
            content: assistantContent || null,
            tool_calls: assistantToolCalls,
          });

          for (const tc of assistantToolCalls) {
            let toolArgs: Record<string, unknown> = {};
            try {
              toolArgs = JSON.parse(tc.function.arguments);
            } catch { /* ignore */ }

            send(JSON.stringify({ tool_call: { name: tc.function.name, args: toolArgs } }));

            const result = await executeTool(tc.function.name, toolArgs, supaCfg);

            toolCallMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.function.name,
              content: JSON.stringify(result),
            });
          }

          loopMessages = [...loopMessages, ...toolCallMessages];
        }

        send("[DONE]");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send(JSON.stringify({ error: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
