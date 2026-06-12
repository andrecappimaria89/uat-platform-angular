// This script runs before ng build to inject Netlify env vars into environment files
const fs = require('fs')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

const content = `export const environment = {
  production: true,
  supabaseUrl: '${url}',
  supabaseAnonKey: '${key}',
}
`

fs.writeFileSync('./src/environments/environment.prod.ts', content)
fs.writeFileSync('./src/environments/environment.ts', content)
console.log('[set-env] Supabase URL configurado:', url ? '✅' : '❌ VAZIO')
console.log('[set-env] Supabase KEY configurado:', key ? '✅' : '❌ VAZIO')
