/**
 * jax-monitor.mts
 *
 * Background monitoring handler for Jax AI.
 * Checks urgency conditions in the database and returns actionable notifications.
 *
 * POST /netlify/functions/jax-monitor
 * Body: { userId: string, role: UserRole, locationId?: string }
 * Returns: JSON { notifications: JaxNotification[], checkAt: string }
 */

import type { Context } from "@netlify/functions";

type UserRole = "sysadmin" | "admin" | "staff" | "field_agent";

interface JaxNotification {
  title: string;
  message: string;
  urgency: "critical" | "warning" | "info";
  entityType: string;
  entityId: string | null;
  route: string;
}

interface AlertRow {
  id: string;
  severity: string;
  description: string;
  client_id: string | null;
  created_at: string;
}

interface CheckInRow {
  id: string;
  status: string;
  client_id: string | null;
  created_at: string;
}

const ALLOWED_ROLES: UserRole[] = ["sysadmin", "admin", "staff", "field_agent"];

// Next check interval in minutes (role-based urgency)
const NEXT_CHECK_MINUTES: Record<UserRole, number> = {
  sysadmin: 2,
  admin: 3,
  staff: 5,
  field_agent: 5,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function getEnv(key: string): string {
  return (
    (typeof Netlify !== "undefined" && Netlify.env?.get(key)) ||
    process.env[key] ||
    ""
  );
}

function supabaseHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

async function sbSelect<T = unknown>(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  query: string,
): Promise<T[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: supabaseHeaders(serviceKey),
  });
  if (!res.ok) {
    // Table may not exist — return empty rather than throwing
    return [];
  }
  return res.json() as Promise<T[]>;
}

async function sbInsert(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...supabaseHeaders(serviceKey), Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

export default async (req: Request, _context: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  // Parse body
  let body: { userId?: unknown; role?: unknown; locationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const userId = String(body.userId ?? "").trim();
  const role = String(body.role ?? "") as UserRole;
  const locationId = body.locationId ? String(body.locationId) : undefined;

  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ error: "Forbidden: invalid role" }, 403);
  }

  if (!userId) {
    return jsonResponse({ error: "userId is required" }, 400);
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Database service unavailable" }, 503);
  }

  const notifications: JaxNotification[] = [];

  // ── Condition 1: Unresolved high-severity alerts older than 30 minutes ──────
  try {
    const thirtyMinAgo = isoMinutesAgo(30);
    const alertQuery = [
      "select=id,severity,description,client_id,created_at",
      "severity=eq.high",
      "resolved=eq.false",
      `created_at=lt.${thirtyMinAgo}`,
      "order=created_at.asc",
      "limit=10",
    ].join("&");

    const highAlerts = await sbSelect<AlertRow>(
      supabaseUrl,
      serviceKey,
      "crisis_events_1777090008",
      alertQuery,
    );

    for (const alert of highAlerts) {
      const ageMinutes = Math.floor(
        (Date.now() - new Date(alert.created_at).getTime()) / 60000,
      );
      notifications.push({
        title: "Unresolved High-Severity Alert",
        message: `Alert open for ${ageMinutes} minutes: ${alert.description ?? "No description"}`,
        urgency: "critical",
        entityType: "crisis_event",
        entityId: alert.id,
        route: `/admin/alerts/${alert.id}`,
      });
    }
  } catch (err) {
    console.error("[jax-monitor] Failed to check high-severity alerts:", err);
  }

  // ── Condition 2: Appointments starting in 15 minutes with no check-in ────────
  try {
    const nowIso = new Date().toISOString();
    const fifteenMinLater = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const apptQuery = [
      "select=id,client_id,scheduled_at,status,appointment_type",
      `scheduled_at=gte.${nowIso}`,
      `scheduled_at=lte.${fifteenMinLater}`,
      "status=neq.checked_in",
      "status=neq.completed",
      "status=neq.cancelled",
      "limit=10",
    ].join("&");

    const upcomingAppts = await sbSelect<{
      id: string;
      client_id: string;
      scheduled_at: string;
      status: string;
      appointment_type: string;
    }>(supabaseUrl, serviceKey, "appointments", apptQuery);

    for (const appt of upcomingAppts) {
      const minsUntil = Math.floor(
        (new Date(appt.scheduled_at).getTime() - Date.now()) / 60000,
      );
      notifications.push({
        title: "Upcoming Appointment — No Check-in",
        message: `${appt.appointment_type ?? "Appointment"} in ${minsUntil} minutes (client ${appt.client_id}) has no check-in recorded.`,
        urgency: "warning",
        entityType: "appointment",
        entityId: appt.id,
        route: `/appointments/${appt.id}`,
      });
    }
  } catch {
    // appointments table may not exist — skip gracefully
  }

  // ── Condition 3: New urgent check-ins unresolved in the last 60 minutes ──────
  try {
    const sixtyMinAgo = isoMinutesAgo(60);
    const checkInQuery = [
      "select=id,status,client_id,created_at",
      "status=in.(urgent,pending)",
      "resolved=eq.false",
      `created_at=gte.${sixtyMinAgo}`,
      "order=created_at.desc",
      "limit=10",
    ].join("&");

    const urgentCheckIns = await sbSelect<CheckInRow>(
      supabaseUrl,
      serviceKey,
      "check_ins_1740395000",
      checkInQuery,
    );

    for (const checkIn of urgentCheckIns) {
      notifications.push({
        title: "Urgent Check-in Unresolved",
        message: `A ${checkIn.status} check-in submitted ${new Date(checkIn.created_at).toLocaleTimeString("en-AU")} requires attention.`,
        urgency: checkIn.status === "urgent" ? "critical" : "warning",
        entityType: "check_in",
        entityId: checkIn.id,
        route: `/admin/check-ins/${checkIn.id}`,
      });
    }
  } catch (err) {
    console.error("[jax-monitor] Failed to check urgent check-ins:", err);
  }

  // ── Insert new notifications into jax_notifications table ────────────────────
  if (notifications.length > 0) {
    try {
      await Promise.all(
        notifications.map((n) =>
          sbInsert(supabaseUrl, serviceKey, "jax_notifications", {
            recipient_id: userId,
            recipient_role: role,
            location_id: locationId ?? null,
            title: n.title,
            message: n.message,
            urgency: n.urgency,
            entity_type: n.entityType,
            entity_id: n.entityId ?? null,
            route: n.route,
            read: false,
            dismissed: false,
            created_at: new Date().toISOString(),
          }),
        ),
      );
    } catch (err) {
      console.error("[jax-monitor] Failed to insert notifications:", err);
    }
  }

  // Calculate next check time
  const nextCheckMins = NEXT_CHECK_MINUTES[role] ?? 5;
  const checkAt = new Date(Date.now() + nextCheckMins * 60 * 1000).toISOString();

  return jsonResponse({ notifications, checkAt });
};
