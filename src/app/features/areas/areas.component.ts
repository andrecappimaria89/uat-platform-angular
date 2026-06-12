import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectAreas, selectUsers, selectScenarios, selectSelectedPlanId, selectIsProjectLocked } from '../../core/services/store.selectors'
import { addArea, updateArea, deleteArea } from '../../core/services/store.actions'
import type { Area } from '../../core/models'
import { map, combineLatest } from 'rxjs'

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Gestão de Áreas">
        <button mat-flat-button color="primary" *ngIf="!(locked$ | async)" (click)="openNew()">
          <mat-icon>add</mat-icon> Nova Área
        </button>
      </app-topbar>

      <div class="content">

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title">
            <mat-icon>{{ editingArea ? 'edit' : 'add_business' }}</mat-icon>
            {{ editingArea ? 'Editar Área' : 'Nova Área' }}
          </h3>
          <div class="form-grid">
            <div class="form-field"><label>Nome da Área *</label><input [(ngModel)]="form.name" placeholder="Ex: Financeiro"></div>
            <div class="form-field">
              <label>Responsável</label>
              <select [(ngModel)]="form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of users$ | async" [value]="u.name">{{ u.name }}</option>
              </select>
              <small *ngIf="form.responsible_name" class="auto-fill">✓ Responsável: {{ form.responsible_name }}</small>
            </div>
          </div>
          <div class="form-actions">
            <button mat-stroked-button (click)="closeForm()">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()">
              <mat-icon>save</mat-icon> {{ editingArea ? 'Salvar' : 'Criar Área' }}
            </button>
          </div>
        </div>

        <!-- Cards de área -->
        <div class="areas-grid">
          <div class="area-card" *ngFor="let a of areaStats$ | async">
            <div class="area-header">
              <div>
                <p class="area-name">{{ a.name }}</p>
                <p class="area-resp">{{ a.responsible_name || 'Sem responsável' }}</p>
              </div>
              <div class="area-actions" *ngIf="!(locked$ | async)">
                <button mat-icon-button (click)="openEdit(a)" title="Editar"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="remove(a)" title="Excluir"><mat-icon>delete</mat-icon></button>
              </div>
            </div>
            <div class="area-stats">
              <div class="stat-row"><span>Total de cenários</span><span class="stat-val">{{ a.total }}</span></div>
              <div class="stat-row"><span>Executados</span><span class="stat-val">{{ a.executed }}</span></div>
              <div class="stat-row"><span>Bloqueados</span><span class="stat-val red">{{ a.blocked }}</span></div>
              <div class="stat-row"><span>Sucesso</span><span class="stat-val" [class.green]="a.pct >= 80" [class.amber]="a.pct < 80">{{ a.pct }}%</span></div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="a.pct" [style.background]="a.pct >= 80 ? '#3B6D11' : a.pct >= 50 ? '#EF9F27' : '#A32D2D'"></div>
            </div>
          </div>
          <div *ngIf="!(areas$ | async)?.length" class="empty-state">
            <mat-icon>business</mat-icon>
            <p>Nenhuma área cadastrada.</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .form-card { border:1.5px solid #185FA5; background:#F8FBFF; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input, .form-field select { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus { outline:none; border-color:#185FA5; }
    .auto-fill { font-size:11px; color:#3B6D11; margin-top:2px; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .areas-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:14px; }
    .area-card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:16px; }
    .area-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .area-name { font-size:14px; font-weight:500; }
    .area-resp { font-size:12px; color:#888780; margin-top:2px; }
    .area-actions { display:flex; gap:2px; }
    .area-stats { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
    .stat-row { display:flex; justify-content:space-between; font-size:12px; color:#888780; }
    .stat-val { font-weight:500; color:#1a1a1a; }
    .stat-val.red { color:#A32D2D; }
    .stat-val.green { color:#3B6D11; }
    .stat-val.amber { color:#854F0B; }
    .progress-bar { background:#E5E5E5; border-radius:4px; height:6px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:4px; transition:width .4s; }
    .empty-state { text-align:center; padding:32px; color:#888780; grid-column:1/-1; }
    .empty-state mat-icon { font-size:40px; width:40px; height:40px; margin-bottom:8px; }
    @media(max-width:600px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class AreasComponent implements OnInit {
  showForm    = false
  editingArea: Area | null = null
  form: Partial<Area> = {}

  areas$   = this.store.select(selectAreas)
  users$   = this.store.select(selectUsers)
  locked$  = this.store.select(selectIsProjectLocked)

  areaStats$ = combineLatest([
    this.store.select(selectAreas),
    this.store.select(selectScenarios),
    this.store.select(selectSelectedPlanId),
  ]).pipe(map(([areas, scenarios, planId]) =>
    areas.map(a => {
      const s        = scenarios.filter(sc => sc.area_name === a.name && (!planId || sc.project_id === planId))
      const total    = s.length
      const success  = s.filter(sc => sc.status === 'sucesso' || sc.status === 'concluido').length
      const blocked  = s.filter(sc => sc.status === 'bloqueado').length
      const executed = s.filter(sc => sc.status !== 'todo').length
      const pct      = total > 0 ? Math.round((success / total) * 100) : 0
      return { ...a, total, success, blocked, executed, pct }
    })
  ))

  constructor(private store: Store, private snack: MatSnackBar) {}
  ngOnInit() {}

  openNew()         { this.editingArea = null; this.form = { name: '', responsible_name: '' }; this.showForm = true }
  openEdit(a: Area) { this.editingArea = a; this.form = { name: a.name, responsible_name: a.responsible_name ?? '' }; this.showForm = true }
  closeForm()       { this.showForm = false; this.editingArea = null; this.form = {} }

  save() {
    if (!this.form.name) { this.snack.open('Nome é obrigatório.', 'OK', { duration: 3000 }); return }
    if (this.editingArea) {
      this.store.dispatch(updateArea({ area: { ...this.editingArea, ...this.form } as Area }))
      this.snack.open('Área atualizada.', 'OK', { duration: 3000 })
    } else {
      this.store.dispatch(addArea({ area: { id: crypto.randomUUID(), ...this.form, created_at: new Date().toISOString() } as Area }))
      this.snack.open('Área criada.', 'OK', { duration: 3000 })
    }
    this.closeForm()
  }

  remove(a: Area) {
    if (!confirm(`Excluir área "${a.name}"?`)) return
    this.store.dispatch(deleteArea({ id: a.id }))
    this.snack.open('Área excluída.', 'OK', { duration: 3000 })
  }
}
