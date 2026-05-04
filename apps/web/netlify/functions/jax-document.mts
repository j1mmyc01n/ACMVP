/**
 * jax-document.mts
 *
 * Clinical and administrative document generation handler using OpenAI gpt-4o.
 *
 * POST /netlify/functions/jax-document
 * Body: { type, clientName?, context?, role, userId }
 * Returns: JSON { document: { title, type, content, content_html } }
 */

import type { Context } from "@netlify/functions";

type UserRole = "sysadmin" | "admin" | "staff" | "field_agent";

type DocumentType =
  | "progress_note"
  | "referral"
  | "discharge_summary"
  | "care_plan"
  | "report"
  | "letter";

interface DocumentResult {
  title: string;
  type: DocumentType;
  content: string;
  content_html: string;
}

const ALLOWED_ROLES: UserRole[] = ["sysadmin", "admin", "staff", "field_agent"];
const VALID_DOC_TYPES: DocumentType[] = [
  "progress_note",
  "referral",
  "discharge_summary",
  "care_plan",
  "report",
  "letter",
];

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

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

// ─── Document type configurations ────────────────────────────────────────────

interface DocConfig {
  title: string;
  systemPrompt: string;
  userPromptTemplate: (clientName: string, context: string) => string;
}

const DOC_CONFIGS: Record<DocumentType, DocConfig> = {
  progress_note: {
    title: "Clinical Progress Note",
    systemPrompt: `You are a clinical documentation specialist for an Australian mental health and disability support platform.
Generate professional, structured clinical progress notes that comply with Australian healthcare documentation standards.
Use SOAP format (Subjective, Objective, Assessment, Plan) where applicable.
Include: date, presenting concerns, observations, interventions, client response, and next steps.
Be concise, objective, and clinically appropriate. Avoid jargon that clients may not understand.
Do not include identifying information unless explicitly provided.`,
    userPromptTemplate: (clientName, context) =>
      `Generate a clinical progress note${clientName ? ` for client: ${clientName}` : ""}.
${context ? `Clinical context and session notes:\n${context}` : "Create a template progress note with placeholder sections."}

Format as a structured document with clear section headings. Include today's date (${new Date().toLocaleDateString("en-AU")}).`,
  },

  referral: {
    title: "Referral Letter",
    systemPrompt: `You are a clinical documentation specialist for an Australian mental health and disability support platform.
Generate professional referral letters compliant with Australian healthcare standards.
Include: referrer details (placeholders), recipient details (placeholders), client demographics (placeholders if not provided), reason for referral, relevant history, current status, specific referral request, and urgency.
Use formal letter format. Reference relevant NDIS, Medicare, or AHPRA considerations where appropriate.`,
    userPromptTemplate: (clientName, context) =>
      `Generate a referral letter${clientName ? ` for client: ${clientName}` : ""}.
${context ? `Referral context:\n${context}` : "Create a template referral letter with placeholder fields."}

Format as a formal letter dated ${new Date().toLocaleDateString("en-AU")}. Use [PLACEHOLDER] for information not provided.`,
  },

  discharge_summary: {
    title: "Discharge Summary",
    systemPrompt: `You are a clinical documentation specialist for an Australian mental health and disability support platform.
Generate comprehensive discharge summaries compliant with Australian healthcare documentation standards.
Include: admission/engagement period, presenting problems, treatment provided, progress made, discharge status, ongoing support plan, follow-up recommendations, and emergency contact information.
Be thorough but concise. Ensure continuity of care is clearly communicated.`,
    userPromptTemplate: (clientName, context) =>
      `Generate a discharge summary${clientName ? ` for client: ${clientName}` : ""}.
${context ? `Discharge context:\n${context}` : "Create a template discharge summary with placeholder sections."}

Format as a structured clinical document dated ${new Date().toLocaleDateString("en-AU")}.`,
  },

  care_plan: {
    title: "Care Plan",
    systemPrompt: `You are a clinical documentation specialist for an Australian mental health and disability support platform.
Generate person-centred care plans compliant with NDIS and Australian mental health care standards.
Include: client goals (short and long-term), identified strengths and barriers, support strategies, responsible parties, review dates, crisis management plan, and consent considerations.
Use person-first language. Ensure the plan is realistic, measurable, and recovery-oriented.`,
    userPromptTemplate: (clientName, context) =>
      `Generate a care plan${clientName ? ` for client: ${clientName}` : ""}.
${context ? `Client context and goals:\n${context}` : "Create a template care plan with placeholder sections for all key areas."}

Format as a structured document dated ${new Date().toLocaleDateString("en-AU")}. Include review date 3 months from now.`,
  },

  report: {
    title: "Administrative Report",
    systemPrompt: `You are a report writing specialist for an Australian mental health and disability support platform.
Generate professional administrative and clinical reports suitable for internal review, board presentation, or external submission.
Include: executive summary, background, findings, analysis, recommendations, and conclusion.
Use formal language, clear headings, and evidence-based reasoning. Include appropriate disclaimers.`,
    userPromptTemplate: (clientName, context) =>
      `Generate an administrative report${clientName ? ` regarding: ${clientName}` : ""}.
${context ? `Report context and requirements:\n${context}` : "Create a template report structure with placeholder sections."}

Format as a formal document dated ${new Date().toLocaleDateString("en-AU")}.`,
  },

  letter: {
    title: "Letter",
    systemPrompt: `You are a professional correspondence specialist for an Australian mental health and disability support platform.
Generate clear, professional letters suitable for clients, families, referrers, government bodies, or other stakeholders.
Maintain a respectful, empathetic, and professional tone. Use plain English where possible.
Include appropriate salutation, body, and closing.`,
    userPromptTemplate: (clientName, context) =>
      `Generate a professional letter${clientName ? ` regarding or addressed to: ${clientName}` : ""}.
${context ? `Letter context and purpose:\n${context}` : "Create a template letter with placeholder fields."}

Format as a formal letter dated ${new Date().toLocaleDateString("en-AU")}. Use [PLACEHOLDER] for missing details.`,
  },
};

// ─── Markdown-to-HTML converter (lightweight, no dependencies) ────────────────

function markdownToHtml(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Horizontal rules
    .replace(/^---+$/gm, "<hr />")
    // Unordered lists
    .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Paragraphs (double newlines)
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async (req: Request, _context: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  // Check API key
  const openaiKey = getEnv("OPENAI_API_KEY");
  if (!openaiKey) {
    return jsonResponse({ error: "Document generation service unavailable: missing API key" }, 503);
  }

  // Parse body
  let body: {
    type?: unknown;
    clientName?: unknown;
    context?: unknown;
    role?: unknown;
    userId?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const type = String(body.type ?? "") as DocumentType;
  const clientName = body.clientName ? String(body.clientName).trim() : undefined;
  const context = body.context ? String(body.context).trim() : undefined;
  const role = String(body.role ?? "") as UserRole;
  const userId = String(body.userId ?? "").trim();

  // Validate role
  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ error: "Forbidden: invalid role" }, 403);
  }

  // Validate document type
  if (!VALID_DOC_TYPES.includes(type)) {
    return jsonResponse(
      {
        error: `Invalid document type. Must be one of: ${VALID_DOC_TYPES.join(", ")}`,
      },
      400,
    );
  }

  const config = DOC_CONFIGS[type];

  // Call OpenAI gpt-4o (non-streaming)
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: config.systemPrompt },
        {
          role: "user",
          content: config.userPromptTemplate(clientName ?? "", context ?? ""),
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text().catch(() => "unknown error");
    console.error("[jax-document] OpenAI error:", openaiRes.status, errText);
    return jsonResponse({ error: `Document generation failed: ${openaiRes.status}` }, 502);
  }

  const openaiData = await openaiRes.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = openaiData.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    return jsonResponse({ error: "Document generation returned empty content" }, 502);
  }

  // Build title with client name if provided
  const title = clientName
    ? `${config.title} — ${clientName} — ${new Date().toLocaleDateString("en-AU")}`
    : `${config.title} — ${new Date().toLocaleDateString("en-AU")}`;

  const document: DocumentResult = {
    title,
    type,
    content,
    content_html: markdownToHtml(content),
  };

  return jsonResponse({ document });
};
