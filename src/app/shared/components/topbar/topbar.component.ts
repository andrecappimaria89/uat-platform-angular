import { Component, OnInit, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { selectPlans, selectSelectedPlanId } from '../../services/store.selectors'
import { selectPlan, setGlobalSearch } from '../../services/store.actions'
import type { TestPlan } from '../../models'

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="topbar">
      <div class="topbar-left">
        <!-- ITEM 8: Tooltip com regras de utilização ao hover no título -->
        <div class="title-wrapper"
          [matTooltip]="usageTooltip"
          matTooltipPosition="below"
          matTooltipClass="usage-tooltip">
          <h1 class="topbar-title">{{ title }}</h1>
          <mat-icon class="info-icon">info_outline</mat-icon>
        </div>

        <!-- Busca global -->
        <div class="search-wrapper">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            [(ngModel)]="searchValue"
            (ngModelChange)="onSearch($event)"
            placeholder="Busca global..."
            class="search-input">
          <button *ngIf="searchValue" class="search-clear" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="topbar-right">
        <!-- ITEM 3/6: Seletor de projeto com default "Todos os Projetos" -->
        <select *ngIf="showProjectSelector"
          [(ngModel)]="selectedPlanId"
          (ngModelChange)="onProjectChange($event)"
          class="project-select">
          <option value="">Todos os Projetos</option>
          <option *ngFor="let p of plans" [value]="p.id">
            {{ p.project }} · {{ p.version }}
            <span *ngIf="p.status === 'concluido'"> ✓</span>
          </option>
        </select>

        <!-- Slot para botões de ação -->
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .topbar { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:60px; background:white; border-bottom:0.5px solid rgba(0,0,0,.08); gap:16px; flex-shrink:0; }
    .topbar-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
    .topbar-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .title-wrapper { display:flex; align-items:center; gap:4px; cursor:default; flex-shrink:0; }
    .topbar-title { font-size:16px; font-weight:500; color:#1a1a1a; white-space:nowrap; margin:0; }
    .info-icon { font-size:14px; width:14px; height:14px; color:#888780; opacity:.6; }
    .info-icon:hover { opacity:1; color:#185FA5; }
    .search-wrapper { display:flex; align-items:center; background:#f5f5f5; border-radius:8px; padding:0 10px; gap:6px; flex:1; max-width:300px; }
    .search-icon { font-size:16px; width:16px; height:16px; color:#888780; flex-shrink:0; }
    .search-input { border:none; background:transparent; font-size:13px; outline:none; width:100%; padding:7px 0; font-family:inherit; }
    .search-clear { background:none; border:none; cursor:pointer; padding:2px; display:flex; color:#888780; }
    .search-clear mat-icon { font-size:14px; width:14px; height:14px; }
    .project-select { padding:7px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; background:white; font-family:inherit; cursor:pointer; max-width:220px; }
    .project-select:focus { outline:none; border-color:#185FA5; }
  `],
})
export class TopbarComponent implements OnInit {
  @Input() title = ''
  @Input() showProjectSelector = true

  plans: TestPlan[] = []
  selectedPlanId = ''   // ITEM 3/6: inicia como '' = Todos os Projetos
  searchValue = ''

  // ITEM 8: Conteúdo do tooltip com regras de utilização
  usageTooltip = `Regra de utilização:\n1. Criar usuário\n2. Criar área e atrelar o usuário à área\n3. Cadastrar o Plano de Teste`

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.select(selectPlans).subscribe(plans => this.plans = plans)

    // ITEM 3/6: Garante que ao inicializar o selectedPlanId do store
    // reflita corretamente o estado ('' = Todos os Projetos)
    this.store.select(selectSelectedPlanId).subscribe(id => {
      this.selectedPlanId = id ?? ''
    })
  }

  onProjectChange(planId: string) {
    this.store.dispatch(selectPlan({ planId: planId || '' }))
  }

  onSearch(value: string) {
    this.store.dispatch(setGlobalSearch({ search: value }))
  }

  clearSearch() {
    this.searchValue = ''
    this.store.dispatch(setGlobalSearch({ search: '' }))
  }
}
