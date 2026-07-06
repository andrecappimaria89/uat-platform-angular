import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { selectTheme } from '../../../core/services/store.selectors'
import { setTheme } from '../../../core/services/store.actions'

interface NavItem {
  section?: string
  path?:    string
  label?:   string
  icon?:    string
}

@Component({
  selector:   'app-sidebar',
  standalone: true,
  imports:    [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-logo"
        matTooltip="Regra de utilização:
1. Criar usuário
2. Criar área e atrelar o usuário à área correspondente
3. Cadastrar o Plano de Teste"
        matTooltipPosition="right"
        matTooltipClass="usage-tooltip"
        style="cursor:help">
        <span class="brand">UAT</span>Platform
        <small>v3.1 · Homologação</small>
      </div>
      <nav class="nav">
        <ng-container *ngFor="let item of NAV">
          <p *ngIf="item.section" class="nav-section">{{ item.section }}</p>
          <a *ngIf="item.path !== undefined"
             [routerLink]="item.path === '' ? '/' : item.path"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.path === '' }"
             class="nav-item">
            <mat-icon>{{ item.icon }}</mat-icon>
            {{ item.label }}
          </a>
        </ng-container>
      </nav>
      <div class="sidebar-footer">
        <div class="user-row">
          <div class="avatar">AD</div>
          <div class="user-info">
            <span>Administrador</span>
            <small>admin</small>
          </div>
          <button class="theme-btn" (click)="toggleTheme()">
            <mat-icon>{{ (theme$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar { width:240px; min-width:240px; background:white; border-right:0.5px solid rgba(0,0,0,.08); display:flex; flex-direction:column; height:100vh; overflow-y:auto; }
    .sidebar-logo { padding:16px; border-bottom:0.5px solid rgba(0,0,0,.08); font-size:15px; font-weight:500; }
    .sidebar-logo small { display:block; font-size:11px; color:#888780; margin-top:2px; font-weight:400; }
    .brand { color:#185FA5; }
    .nav { flex:1; padding:8px 0; }
    .nav-section { padding:10px 16px 4px; font-size:10px; font-weight:500; text-transform:uppercase; letter-spacing:.05em; color:#888780; }
    .nav-item { display:flex; align-items:center; gap:8px; padding:8px 12px; margin:1px 8px; border-radius:8px; text-decoration:none; font-size:13px; color:#444441; transition:all .15s; }
    .nav-item mat-icon { font-size:18px; width:18px; height:18px; }
    .nav-item:hover { background:#f5f5f5; }
    .nav-item.active { background:#E6F1FB; color:#185FA5; font-weight:500; }
    .sidebar-footer { padding:12px; border-top:0.5px solid rgba(0,0,0,.08); }
    .user-row { display:flex; align-items:center; gap:8px; }
    .avatar { width:32px; height:32px; border-radius:50%; background:#E6F1FB; color:#185FA5; font-size:11px; font-weight:500; display:flex; align-items:center; justify-content:center; }
    .user-info { flex:1; }
    .user-info span { display:block; font-size:13px; font-weight:500; }
    .user-info small { font-size:11px; color:#888780; }
    .theme-btn { background:none; border:none; cursor:pointer; color:#888780; padding:4px; border-radius:6px; display:flex; align-items:center; }
    .theme-btn:hover { background:#f5f5f5; }
  `],
})
export class SidebarComponent {
  theme$ = this.store.select(selectTheme)

  NAV: NavItem[] = [
    { section: 'Principal' },
    { path: '',          label: 'Dashboard',            icon: 'dashboard'   },
    { path: 'plano',     label: 'Plano de Testes',      icon: 'assignment'  },
    { path: 'cenarios',  label: 'Cenários e Evidências', icon: 'science'    },
    { section: 'Issues' },
    { path: 'issues',    label: 'Controle de Issues',   icon: 'bug_report'  },
    { path: 'sumario',   label: 'Sumário de Issues',    icon: 'pie_chart'   },
    { section: 'Gestão' },
    { path: 'historico', label: 'Histórico de Versões', icon: 'history'     },
    { path: 'areas',     label: 'Gestão de Áreas',      icon: 'business'    },
    { path: 'usuarios',  label: 'Gestão de Usuários',   icon: 'group'       },
    { section: 'Ferramentas' },
    { path: 'importar',  label: 'Importar Planilha',    icon: 'upload_file' },
    { path: 'config',    label: 'Configurações',        icon: 'settings'    },
  ]

  constructor(private store: Store) {}

  toggleTheme() {
    this.store.select(selectTheme).subscribe(t =>
      this.store.dispatch(setTheme({ theme: t === 'light' ? 'dark' : 'light' }))
    ).unsubscribe()
  }
}
