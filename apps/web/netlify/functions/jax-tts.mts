/**
 * jax-tts.mts
 *
 * Text-to-Speech handler for Jax AI using OpenAI TTS API.
 *
 * POST /netlify/functions/jax-tts
 * Body: { text: string, voice?: string }
 * Returns: audio/mpeg binary stream
 */

import type { Context } from "@netlify/functions";

const MAX_TEXT_LENGTH = 4000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const VALID_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type Voice = (typeof VALID_VOICES)[number];

function getEnv(key: string): string {
  return (
    (typeof Netlify !== "undefined" && Netlify.env?.get(key)) ||
    process.env[key] ||
    ""
  );
}

const jsonError = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

export default async (req: Request, _context: Context) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonError("Method Not Allowed", 405);
  }

  // Verify Authorization header contains a bearer token.
  // Full JWT validation against Supabase auth is complex in Netlify edge functions
  // (requires importing the Supabase client or manually verifying JWTs).
  // This presence check acts as a minimal guard; the calling app must pass its
  // session token. Production hardening: verify the JWT signature using the
  // SUPABASE_JWT_SECRET and reject expired/invalid tokens.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonError("Unauthorized: missing bearer token", 401);
  }

  // Check API key availability
  const openaiKey = getEnv("OPENAI_API_KEY");
  if (!openaiKey) {
    return jsonError("TTS service unavailable: missing API key", 503);
  }

  // Parse body
  let body: { text?: unknown; voice?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const text = String(body.text ?? "").trim();
  if (!text) {
    return jsonError("text is required", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(`text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`, 400);
  }

  // Validate voice (default to 'nova' — warm, professional tone for a healthcare assistant)
  const rawVoice = String(body.voice ?? "nova") as Voice;
  const voice: Voice = VALID_VOICES.includes(rawVoice) ? rawVoice : "nova";

  // Call OpenAI TTS API
  const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!ttsRes.ok) {
    const errText = await ttsRes.text().catch(() => "unknown error");
    console.error("[jax-tts] OpenAI TTS error:", ttsRes.status, errText);
    return jsonError(`TTS request failed: ${ttsRes.status}`, 502);
  }

  // Stream the audio response back
  return new Response(ttsRes.body, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "Content-Disposition": "inline; filename=\"jax-speech.mp3\"",
    },
  });
};
