import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { Observable } from 'rxjs'
import { SidebarComponent } from './shared/components/sidebar/sidebar.component'
import { bootstrap } from './core/services/store.actions'
import { selectLoading } from './core/services/store.selectors'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatIconModule } from '@angular/material/icon'
import { SupabaseService } from './core/services/supabase.service'

@Component({
  selector:    'app-root',
  standalone:  true,
  imports:     [CommonModule, RouterOutlet, SidebarComponent, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="app-shell">

      <!-- Alerta crítico: Supabase não conectado -->
      <div *ngIf="!supabaseReady" class="db-warning">
        <mat-icon>warning</mat-icon>
        <span>
          <strong>Atenção:</strong> Supabase não configurado — dados não estão sendo salvos e serão perdidos ao recarregar.
          Verifique as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no Netlify.
        </span>
      </div>

      <div class="shell-body">
        <!-- Loading overlay -->
        <div *ngIf="loading$ | async" class="loading-overlay">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando dados do Supabase...</p>
        </div>

        <app-sidebar></app-sidebar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .shell-body {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow-y: auto;
    }
    .db-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #A32D2D;
      color: white;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 500;
      flex-shrink: 0;
      z-index: 200;
    }
    .db-warning mat-icon { flex-shrink: 0; font-size: 18px; }
    .db-warning code { background: rgba(255,255,255,.2); padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; }
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,.9);
      z-index: 999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 13px;
      color: #888780;
    }
  `],
})
export class AppComponent implements OnInit {
  loading$: Observable<boolean>
  supabaseReady: boolean

  constructor(private store: Store, private supabase: SupabaseService) {
    this.loading$      = this.store.select(selectLoading)
    this.supabaseReady = supabase.ready
  }

  ngOnInit(): void {
    if (!this.supabaseReady) {
      console.error('❌ Supabase não configurado — dados não serão persistidos.')
    }
    this.store.dispatch(bootstrap())
  }
}
