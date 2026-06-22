import { Injectable } from '@angular/core'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient | null

  constructor() {
    const url = environment.supabaseUrl
    const key = environment.supabaseAnonKey

    if (!url || !key) {
      console.warn('[Supabase] Não configurado — dados não persistem.')
      this.client = null
      return
    }
    this.client = createClient(url, key)
    console.log('[Supabase] ✅ Conectado.')
  }

  get ready(): boolean { return this.client !== null }
}
