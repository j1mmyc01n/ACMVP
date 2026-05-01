// supabase/functions/sysadmin-ai-chat/index.ts
// Sysadmin-only AI chat agent.
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   OPENAI_API_KEY        — your OpenAI API key
//   SYSADMIN_SECRET       — (optional) a pre-shared token for the fallback auth path
//   AI_MODEL              — (optional) defaults to "gpt-4o-mini"
//   AI_SYSTEM_PROMPT      — (optional) custom system prompt for the assistant
//
// Auth flow:
//   1. Primary:  Bearer token is a valid Supabase JWT → user_metadata.role must be "sysadmin"
//                OR the user's email must appear in admin_users table with role = "sysadmin"
//   2. Fallback: Bearer token matches the SYSADMIN_SECRET env var exactly.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful Sysadmin AI assistant for the Acute Care Services platform. ' +
  'You help the system administrator understand data, diagnose issues, manage locations, ' +
  'and answer operational questions. Be concise, clear, and professional.'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── 1. Extract Bearer token ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Verify sysadmin identity ───────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const sysadminSecret = Deno.env.get('SYSADMIN_SECRET') ?? ''

    let isSysadmin = false

    // Path A: validate as a Supabase Auth JWT
    if (supabaseUrl && supabaseAnonKey) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
      const { data: { user }, error: userError } = await userClient.auth.getUser()

      if (!userError && user) {
        // Check user_metadata.role claim
        if (user.user_metadata?.role === 'sysadmin') {
          isSysadmin = true
        } else {
          // Fallback: check admin_users table (app's custom auth table)
          const serviceClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          )
          const { data: adminRecord } = await serviceClient
            .from('admin_users_1777025000000')
            .select('role')
            .ilike('email', user.email ?? '')
            .eq('status', 'active')
            .single()
          if (adminRecord?.role === 'sysadmin') {
            isSysadmin = true
          }
        }
      }
    }

    // Path B: pre-shared sysadmin secret (fallback when no Supabase Auth session)
    if (!isSysadmin && sysadminSecret && token === sysadminSecret) {
      isSysadmin = true
    }

    if (!isSysadmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — sysadmin access only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Parse request body ─────────────────────────────────────────
    const { message, history = [] } = await req.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Call AI provider (OpenAI) ──────────────────────────────────
    const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'AI provider not configured. Set OPENAI_API_KEY in Edge Function secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const model = Deno.env.get('AI_MODEL') || DEFAULT_MODEL
    const systemPrompt = Deno.env.get('AI_SYSTEM_PROMPT') || DEFAULT_SYSTEM_PROMPT

    // Build message history (cap at last 20 turns to stay within token limits)
    const cappedHistory = Array.isArray(history) ? history.slice(-20) : []
    const messages = [
      { role: 'system', content: systemPrompt },
      ...cappedHistory,
      { role: 'user', content: message.trim() },
    ]

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7 }),
    })

    if (!aiRes.ok) {
      const aiErr = await aiRes.json().catch(() => ({}))
      throw new Error(`OpenAI error ${aiRes.status}: ${aiErr?.error?.message ?? aiRes.statusText}`)
    }

    const aiData = await aiRes.json()
    const reply = aiData.choices?.[0]?.message?.content ?? 'No response from AI.'

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('sysadmin-ai-chat error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
