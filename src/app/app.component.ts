import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { Observable } from 'rxjs'
import { SidebarComponent } from './shared/components/sidebar/sidebar.component'
import { bootstrap } from './core/services/store.actions'
import { selectLoading } from './core/services/store.selectors'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@Component({
  selector:    'app-root',
  standalone:  true,
  imports:     [CommonModule, RouterOutlet, SidebarComponent, MatProgressSpinnerModule],
  template: `
    <div class="app-shell">
      <!-- Loading overlay -->
      <div *ngIf="loading$ | async" class="loading-overlay">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Carregando dados...</p>
      </div>

      <app-sidebar></app-sidebar>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,.85);
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

  constructor(private store: Store) {
    this.loading$ = this.store.select(selectLoading)
  }

  ngOnInit(): void {
    this.store.dispatch(bootstrap())
  }
}
