// Supabase Edge Function: create-user
// Substitui a Netlify Function — o Supabase injeta SUPABASE_URL e
// SUPABASE_SERVICE_ROLE_KEY automaticamente no ambiente da Edge Function,
// sem precisar configurar nada manualmente no Netlify.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url        = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { name, email, role, area_name, avatar_initials } = payload

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Nome e e-mail são obrigatórios.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 1) Cria o usuário no Supabase Auth (profiles.id -> auth.users.id via FK)
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  })

  if (inviteError || !invited?.user) {
    const msg = inviteError?.message?.includes('already been registered')
      ? 'Este e-mail já está cadastrado no sistema.'
      : (inviteError?.message || 'Falha ao criar usuário no Supabase Auth.')
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authUser = invited.user

  // 2) Agora que auth.users(id) existe, o insert em profiles satisfaz a FK
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .insert([{
      id: authUser.id,
      name, email,
      role: role || 'executor',
      area_name: area_name || null,
      avatar_initials: avatar_initials || null,
      active: true,
    }])
    .select()
    .single()

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.id) // rollback: evita usuário sem profile
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ user: profile }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
