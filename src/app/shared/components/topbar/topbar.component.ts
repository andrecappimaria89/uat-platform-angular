import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { setGlobalSearch } from '../../core/services/store.actions'
import { selectGlobalSearch, selectPlans, selectSelectedPlanId, selectIsProjectLocked } from '../../core/services/store.selectors'
import { selectPlan } from '../../core/services/store.actions'

@Component({
  selector:   'app-topbar',
  standalone: true,
  imports:    [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <header class="topbar">
      <h1 class="topbar-title">{{ title }}</h1>

      <div class="topbar-center">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            placeholder="Busca global..."
            [ngModel]="search$ | async"
            (ngModelChange)="onSearch($event)"
          >
        </div>
      </div>

      <div class="topbar-right">
        <!-- Project selector -->
        <select
          *ngIf="showProjectSelector"
          [value]="selectedPlanId$ | async"
          (change)="onPlanChange($event)"
          class="project-select"
        >
          <option value="">Todos os Projetos</option>
          <option *ngFor="let p of plans$ | async" [value]="p.id">
            {{ p.project }} {{ p.status === 'concluido' ? '✓' : '' }}
          </option>
        </select>

        <!-- Lock indicator -->
        <span *ngIf="(isLocked$ | async)" class="lock-badge">
          <mat-icon>lock</mat-icon> Projeto Concluído
        </span>

        <!-- Page actions (projected) -->
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 24px; background: white;
      border-bottom: 0.5px solid rgba(0,0,0,.08);
      min-height: 52px; flex-shrink: 0;
    }
    .topbar-title { font-size: 15px; font-weight: 500; white-space: nowrap; }
    .topbar-center { flex: 1; max-width: 320px; }
    .search-wrap {
      display: flex; align-items: center; gap: 6px;
      background: #f5f5f5; border-radius: 8px;
      padding: 6px 10px;
    }
    .search-wrap mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888780; }
    .search-wrap input { background: none; border: none; outline: none; font-size: 13px; width: 100%; }
    .topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .project-select {
      font-size: 13px; border: 0.5px solid rgba(0,0,0,.12);
      border-radius: 8px; padding: 6px 10px; background: white; max-width: 200px;
    }
    .lock-badge {
      display: flex; align-items: center; gap: 4px;
      background: #FAEEDA; color: #854F0B;
      font-size: 12px; font-weight: 500;
      padding: 4px 10px; border-radius: 8px;
    }
    .lock-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class TopbarComponent {
  @Input() title = ''
  @Input() showProjectSelector = true

  search$         = this.store.select(selectGlobalSearch)
  plans$          = this.store.select(selectPlans)
  selectedPlanId$ = this.store.select(selectSelectedPlanId)
  isLocked$       = this.store.select(selectIsProjectLocked)

  constructor(private store: Store) {}

  onSearch(q: string)  { this.store.dispatch(setGlobalSearch({ query: q })) }
  onPlanChange(e: any) { this.store.dispatch(selectPlan({ id: e.target.value })) }
}
