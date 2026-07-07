// Injeta variáveis do Netlify no environment.prod.ts antes do build
// O angular.json usa fileReplacements para substituir environment.ts por environment.prod.ts em produção
const fs = require('fs')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!url || !key) {
  console.error('[set-env] ❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!')
  console.error('[set-env] Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify.')
  process.exit(1) // Falha o build se Supabase não estiver configurado
}

const prodContent = `export const environment = {
  production: true,
  supabaseUrl: '${url}',
  supabaseAnonKey: '${key}',
}
`

// Escreve apenas no environment.prod.ts (usado pelo angular.json em produção)
fs.writeFileSync('./src/environments/environment.prod.ts', prodContent)
console.log('[set-env] Supabase URL configurado: ✅')
console.log('[set-env] Supabase KEY configurado: ✅')
console.log('[set-env] environment.prod.ts atualizado com sucesso.')
