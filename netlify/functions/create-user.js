const { createClient } = require('@supabase/supabase-js')

/**
 * POST /.netlify/functions/create-user
 * body: { name, email, role?, area_name?, avatar_initials? }
 *
 * Por que esta function existe:
 * -------------------------------------------------------------------------
 * A tabela `profiles` tem a constraint:
 *   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
 *
 * Ou seja: só pode existir um `profile` se já existir um `auth.users`
 * com o MESMO id. O frontend (anon key) não tem permissão para criar
 * usuários no Supabase Auth — só a service_role key pode fazer isso
 * (supabase.auth.admin.*). Por isso essa etapa precisa rodar no servidor
 * (Netlify Function), nunca no navegador.
 *
 * Fluxo:
 *   1. Cria o usuário em auth.users (via convite por e-mail).
 *   2. Usa o id retornado para inserir o profile correspondente.
 *   3. Se o passo 2 falhar, desfaz o passo 1 (evita usuário "fantasma"
 *      no Auth sem profile).
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[create-user] Faltam variáveis de ambiente SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no Netlify.')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Servidor não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Netlify.' }),
    }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição inválido.' }) }
  }

  const { name, email, role, area_name, avatar_initials } = payload

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Nome e e-mail são obrigatórios.' }) }
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Cria o usuário no Supabase Auth e envia convite por e-mail
  //    (o usuário define a própria senha ao aceitar o convite).
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  })

  if (inviteError || !invited?.user) {
    console.error('[create-user] Falha ao criar usuário no Auth:', inviteError?.message)
    const msg = inviteError?.message?.includes('already been registered')
      ? 'Este e-mail já está cadastrado no sistema.'
      : (inviteError?.message || 'Falha ao criar usuário no Supabase Auth.')
    return { statusCode: 400, body: JSON.stringify({ error: msg }) }
  }

  const authUser = invited.user

  // 2) Agora que auth.users(id) existe, o insert em profiles satisfaz a FK.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .insert([{
      id: authUser.id,
      name,
      email,
      role: role || 'executor',
      area_name: area_name || null,
      avatar_initials: avatar_initials || null,
      active: true,
    }])
    .select()
    .single()

  if (profileError) {
    console.error('[create-user] Falha ao criar profile, desfazendo usuário no Auth:', profileError.message)
    // Rollback — evita usuário no Auth sem profile correspondente.
    await admin.auth.admin.deleteUser(authUser.id)
    return { statusCode: 400, body: JSON.stringify({ error: profileError.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ user: profile }) }
}
