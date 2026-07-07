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

  // 1) Cria o usuário no Supabase Auth já confirmado, com senha temporária
  //    gerada automaticamente. Evita depender de envio de e-mail (SMTP) e
  //    da validação mais estrita do fluxo de convite.
  const tempPassword = crypto.randomUUID() + 'Aa1!'
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createError || !created?.user) {
    const msg = createError?.message?.includes('already been registered')
      ? 'Este e-mail já está cadastrado no sistema.'
      : (createError?.message || 'Falha ao criar usuário no Supabase Auth.')
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authUser = created.user

  // 2) O banco já tem um trigger (on_auth_user_created -> handle_new_user)
  //    que cria automaticamente uma linha básica em profiles (id, email,
  //    name, avatar_initials) assim que o usuário é criado no Auth. Por
  //    isso, aqui só ATUALIZAMOS essa linha com o role/área escolhidos no
  //    formulário — inserir de novo causaria conflito de chave (409).
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .update({
      role: role || 'executor',
      area_name: area_name || null,
      avatar_initials: avatar_initials || undefined,
      active: true,
    })
    .eq('id', authUser.id)
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
