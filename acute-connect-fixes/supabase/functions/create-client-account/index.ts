// supabase/functions/create-client-account/index.ts
// Safely creates client portal accounts using the service role key
// Called from admin CRM — never expose service role key in frontend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, crn, clientId, firstName, lastName, phone, locationId } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role key — this is safe here (server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Create the Supabase Auth user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // pre-confirm so they can magic link straight in
      user_metadata: {
        role: 'client',
        crn: crn || null,
        first_name: firstName || null,
        last_name: lastName || null,
      }
    })

    if (userError) {
      // If user already exists, just return their ID
      if (userError.message.includes('already been registered')) {
        const { data: existing } = await supabaseAdmin
          .from('client_accounts')
          .select('*')
          .eq('email', email)
          .single()
        return new Response(
          JSON.stringify({ success: true, existing: true, account: existing }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw userError
    }

    // Link to client_accounts table
    const { data: account, error: accountError } = await supabaseAdmin
      .from('client_accounts')
      .insert({
        auth_user_id: userData.user.id,
        client_id: clientId || null,
        crn: crn || null,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        location_id: locationId || null,
        status: 'active',
      })
      .select()
      .single()

    if (accountError) throw accountError

    // Send magic link welcome email
    const { error: magicError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'https://incomparable-starburst-89c1ab.netlify.app'}/checkin`,
      }
    })

    if (magicError) console.error('Magic link error (non-fatal):', magicError)

    return new Response(
      JSON.stringify({ success: true, account }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
