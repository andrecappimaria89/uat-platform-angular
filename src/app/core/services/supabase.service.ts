import { Injectable } from '@angular/core'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient | null

  constructor() {
    // Netlify injeta as variáveis em tempo de build via replace
    const url = (window as any).__SUPABASE_URL__ || ''
    const key = (window as any).__SUPABASE_KEY__ || ''

    if (!url || !key) {
      console.warn('[Supabase] Variáveis não configuradas.')
      this.client = null
      return
    }
    this.client = createClient(url, key)
  }

  get ready(): boolean { return this.client !== null }
}
