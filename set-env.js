const fs = require('fs')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!url || !key) {
  console.error('[set-env] ❌ ERRO: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configurados no Netlify!')
  process.exit(1)
}

// Escreve no environment.prod.ts (usado pelo fileReplacements no angular.json)
const prodContent = `export const environment = {
  production: true,
  supabaseUrl: '${url}',
  supabaseAnonKey: '${key}',
}
`
fs.writeFileSync('./src/environments/environment.prod.ts', prodContent)

// Também escreve no environment.ts como fallback extra de segurança
fs.writeFileSync('./src/environments/environment.ts', prodContent)

console.log('[set-env] ✅ Supabase URL configurado:', url.substring(0, 30) + '...')
console.log('[set-env] ✅ Supabase KEY configurado:', key.substring(0, 20) + '...')
console.log('[set-env] ✅ Ambos environment.ts e environment.prod.ts atualizados.')
