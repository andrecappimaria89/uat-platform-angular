import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectVersions, selectUsers, selectSelectedPlanId, selectPlans } from '../../core/services/store.selectors'
import { addVersion } from '../../core/services/store.actions'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatTooltipModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Histórico de Versões">
        <button class="btn-primary" (click)="showForm = !showForm">
          <mat-icon>add</mat-icon> Nova Versão
        </button>
      </app-topbar>

      <div class="content">

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title"><mat-icon>add_circle</mat-icon> Registrar Nova Versão</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>Versão *</label>
              <input [(ngModel)]="form.version" placeholder="v1.0.0"
                [class.invalid]="formSubmitted && !form.version">
              <span *ngIf="formSubmitted && !form.version" class="error-msg">Versão é obrigatória</span>
            </div>
            <div class="form-field">
              <label>Data *</label>
              <input type="date" [(ngModel)]="form.date"
                [class.invalid]="formSubmitted && !form.date">
              <span *ngIf="formSubmitted && !form.date" class="error-msg">Data é obrigatória</span>
            </div>
            <div class="form-field">
              <label>Projeto</label>
              <select [(ngModel)]="form.plan_id">
                <option value="">Selecione...</option>
                <option *ngFor="let p of plans" [value]="p.id">{{ p.project }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Responsável</label>
              <select [(ngModel)]="form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of users" [value]="u.name">{{ u.name }}</option>
              </select>
            </div>
            <div class="form-field full">
              <label>Descrição *</label>
              <textarea [(ngModel)]="form.description" rows="3" placeholder="Descreva as mudanças desta versão..."
                [class.invalid]="formSubmitted && !form.description"></textarea>
              <span *ngIf="formSubmitted && !form.description" class="error-msg">Descrição é obrigatória</span>
            </div>
            <div class="form-field full">
              <label>Justificativa</label>
              <textarea [(ngModel)]="form.justification" rows="2" placeholder="Motivo da atualização (opcional)"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">
              <mat-icon>save</mat-icon> Salvar Versão
            </button>
          </div>
        </div>

        <!-- Filtro por projeto -->
        <div class="filter-row" *ngIf="(versions$ | async)?.length">
          <select [(ngModel)]="filterPlan" class="select-filter">
            <option value="">Todos os Projetos</option>
            <option *ngFor="let p of plans" [value]="p.id">{{ p.project }}</option>
          </select>
          <span class="count-badge">{{ filteredVersions.length }} versão(ões)</span>
        </div>

        <!-- Timeline — ITEM 7: ordenada cronologicamente (mais recente primeiro) -->
        <div class="card">
          <div *ngIf="filteredVersions.length === 0" class="empty-state">
            <mat-icon>history</mat-icon>
            <p>Nenhuma versão registrada.</p>
            <small>Clique em "Nova Versão" para registrar a primeira.</small>
          </div>

          <div class="timeline">
            <div class="timeline-item" *ngFor="let v of filteredVersions; let i = index">
              <div class="timeline-dot" [class.latest]="i === 0"></div>
              <div class="timeline-content">
                <div class="version-header">
                  <span class="version-badge">{{ v.version }}</span>
                  <span class="version-plan" *ngIf="getPlanName(v.plan_id)">{{ getPlanName(v.plan_id) }}</span>
                  <span class="version-meta">
                    {{ formatDate(v.date) }}
                    <ng-container *ngIf="v.responsible_name"> · {{ v.responsible_name }}</ng-container>
                  </span>
                  <span class="latest-tag" *ngIf="i === 0">Mais recente</span>
                </div>
                <p class="version-desc">{{ v.description }}</p>
                <p class="version-just" *ngIf="v.justification">
                  <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">info</mat-icon>
                  {{ v.justification }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .form-card { border:1.5px solid #185FA5 !important; background:#F8FBFF !important; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field.full { grid-column:1/-1; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input, .form-field select, .form-field textarea { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus { outline:none; border-color:#185FA5; }
    .form-field input.invalid, .form-field textarea.invalid { border-color:#A32D2D !important; }
    .error-msg { font-size:11px; color:#A32D2D; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .filter-row { display:flex; align-items:center; gap:12px; }
    .select-filter { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; background:white; font-family:inherit; }
    .count-badge { font-size:12px; color:#888780; background:#f5f5f5; padding:4px 10px; border-radius:12px; }
    .empty-state { text-align:center; padding:40px; color:#888780; }
    .empty-state mat-icon { font-size:40px; width:40px; height:40px; display:block; margin:0 auto 8px; }
    .empty-state small { font-size:12px; }
    .timeline { display:flex; flex-direction:column; }
    .timeline-item { display:flex; gap:16px; padding:16px 0; border-bottom:0.5px solid rgba(0,0,0,.05); }
    .timeline-item:last-child { border-bottom:none; }
    .timeline-dot { width:12px; height:12px; min-width:12px; border-radius:50%; background:#D3D1C7; margin-top:5px; transition:.2s; }
    .timeline-dot.latest { background:#3B6D11; box-shadow:0 0 0 3px rgba(59,109,17,.15); }
    .timeline-content { flex:1; }
    .version-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
    .version-badge { background:#E6F1FB; color:#185FA5; font-size:12px; font-weight:600; padding:2px 10px; border-radius:12px; }
    .version-plan { background:#f5f5f5; color:#888780; font-size:11px; padding:2px 8px; border-radius:8px; }
    .version-meta { font-size:12px; color:#888780; }
    .latest-tag { background:#EAF3DE; color:#3B6D11; font-size:10px; font-weight:600; padding:2px 8px; border-radius:8px; }
    .version-desc { font-size:13px; font-weight:500; color:#1a1a1a; margin-bottom:4px; }
    .version-just { font-size:12px; color:#888780; display:flex; align-items:flex-start; gap:4px; }
    @media(max-width:600px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class HistoricoComponent implements OnInit {
  showForm = false
  formSubmitted = false
  filterPlan = ''
  filteredVersions: any[] = []
  users: any[] = []
  plans: any[] = []
  planMap: Record<string, string> = {}

  versions$ = combineLatest([
    this.store.select(selectVersions),
    this.store.select(selectSelectedPlanId),
  ]).pipe(
    // ITEM 7: Garantir ordenação cronológica — mais recente primeiro
    map(([versions, planId]) => {
      const filtered = planId
        ? versions.filter(v => !v.plan_id || v.plan_id === planId)
        : versions
      return [...filtered].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime()
        const dateB = new Date(b.date || b.created_at || 0).getTime()
        return dateB - dateA  // mais recente primeiro
      })
    })
  )

  form: any = { version:'', date:'', responsible_name:'', description:'', justification:'', plan_id:'' }

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.store.select(selectUsers).subscribe(u => this.users = u)
    this.store.select(selectPlans).subscribe(p => {
      this.plans = p
      this.planMap = {}
      p.forEach(plan => this.planMap[plan.id] = plan.project)
    })

    // ITEM 7: Aplicar filtro local quando usuário muda o select
    this.versions$.subscribe(versions => {
      this.applyFilter(versions)
    })
  }

  applyFilter(versions?: any[]) {
    const source = versions ?? []
    this.filteredVersions = this.filterPlan
      ? source.filter(v => v.plan_id === this.filterPlan)
      : source
  }

  getPlanName(id: string): string { return id ? (this.planMap[id] ?? '') : '' }

  formatDate(date: string): string {
    if (!date) return '—'
    try {
      // Suporta tanto 'YYYY-MM-DD' quanto ISO timestamp
      const d = new Date(date.includes('T') ? date : date + 'T00:00:00')
      return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
    } catch { return date }
  }

  closeForm() {
    this.showForm = false
    this.formSubmitted = false
    this.form = { version:'', date:'', responsible_name:'', description:'', justification:'', plan_id:'' }
  }

  save() {
    this.formSubmitted = true
    if (!this.form.version)     { this.snack.open('Versão é obrigatória.','OK',{duration:3000}); return }
    if (!this.form.date)        { this.snack.open('Data é obrigatória.','OK',{duration:3000}); return }
    if (!this.form.description) { this.snack.open('Descrição é obrigatória.','OK',{duration:3000}); return }

    this.store.dispatch(addVersion({ version: {
      id:               crypto.randomUUID(),
      ...this.form,
      created_at:       new Date().toISOString(),
    }}))
    this.snack.open('Versão registrada.', 'OK', { duration: 3000 })
    this.closeForm()
  }
}
