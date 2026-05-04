/**
 * jax-whisper.mts
 *
 * Speech-to-Text handler for Jax AI using OpenAI Whisper API.
 *
 * POST /netlify/functions/jax-whisper
 * Body: multipart/form-data with field 'audio' (audio blob — webm, mp4, mp3, wav, etc.)
 * Returns: JSON { transcript: string }
 */

import type { Context } from "@netlify/functions";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Australian healthcare context hint to improve transcription accuracy
const WHISPER_PROMPT =
  "Medical healthcare platform, Australian context, may include: NDIS, Medicare, AHPRA, " +
  "clinical terms, patient names, medication names, SafeScript, My Health Record, " +
  "mental health terminology, crisis support, disability services.";

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
    return jsonResponse({ error: "STT service unavailable: missing API key" }, 503);
  }

  // Parse multipart form data
  let audioBlob: Blob | null = null;
  let audioFilename = "audio.webm";

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioField = formData.get("audio");

      if (!audioField) {
        return jsonResponse({ error: "Missing 'audio' field in form data" }, 400);
      }

      if (audioField instanceof File) {
        audioBlob = audioField;
        audioFilename = audioField.name || "audio.webm";
      } else if (typeof audioField === "string") {
        // Handle base64-encoded audio as a fallback
        const binaryStr = atob(audioField);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: "audio/webm" });
      }
    } else {
      // Fallback: treat entire body as raw audio binary
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        return jsonResponse({ error: "Empty request body" }, 400);
      }
      const detectedType = contentType || "audio/webm";
      audioBlob = new Blob([arrayBuffer], { type: detectedType });
      // Infer extension from content-type
      if (detectedType.includes("mp4") || detectedType.includes("m4a")) {
        audioFilename = "audio.mp4";
      } else if (detectedType.includes("mp3") || detectedType.includes("mpeg")) {
        audioFilename = "audio.mp3";
      } else if (detectedType.includes("wav")) {
        audioFilename = "audio.wav";
      } else if (detectedType.includes("ogg")) {
        audioFilename = "audio.ogg";
      }
    }
  } catch (err) {
    console.error("[jax-whisper] Error parsing request:", err);
    return jsonResponse({ error: "Failed to parse audio data" }, 400);
  }

  if (!audioBlob || audioBlob.size === 0) {
    return jsonResponse({ error: "No audio data received" }, 400);
  }

  // Build multipart form for Whisper API
  const whisperForm = new FormData();
  whisperForm.append("file", audioBlob, audioFilename);
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "en");
  whisperForm.append("prompt", WHISPER_PROMPT);
  whisperForm.append("response_format", "json");

  // Call OpenAI Whisper API
  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      // Do NOT set Content-Type — let fetch set it with the correct multipart boundary
    },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    const errText = await whisperRes.text().catch(() => "unknown error");
    console.error("[jax-whisper] OpenAI Whisper error:", whisperRes.status, errText);
    return jsonResponse({ error: `Transcription failed: ${whisperRes.status}` }, 502);
  }

  const result = await whisperRes.json() as { text?: string; error?: unknown };

  if (!result.text && result.error) {
    return jsonResponse({ error: "Transcription returned an error", detail: result.error }, 502);
  }

  return jsonResponse({ transcript: result.text ?? "" });
};
