import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTableModule } from '@angular/material/table'
import { MatChipsModule } from '@angular/material/chips'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { combineLatest, map } from 'rxjs'
import * as XLSX from 'xlsx'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectFilteredScenarios, selectAreas, selectUsers, selectIsProjectLocked } from '../../core/services/store.selectors'
import { deleteScenario } from '../../core/services/store.actions'
import { SCENARIO_STATUS_LABELS } from '../../core/models/constants'
import type { Scenario } from '../../core/models'

@Component({
  selector:   'app-scenarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatTooltipModule, MatSnackBarModule,
    TopbarComponent,
  ],
  template: `
    <div class="page">
      <app-topbar title="Cenários e Evidências">
        <button mat-stroked-button (click)="exportExcel()">
          <mat-icon>download</mat-icon> Exportar
        </button>
        <button mat-flat-button color="primary" *ngIf="!(locked$ | async)" (click)="openNew()">
          <mat-icon>add</mat-icon> Novo Cenário
        </button>
      </app-topbar>

      <div class="content">
        <!-- Filters -->
        <div class="filters">
          <input [(ngModel)]="search" placeholder="Buscar CT ID, cenário, funcionalidade..." class="filter-input lg">
          <select [(ngModel)]="filterArea" class="filter-select">
            <option value="">Todas as Áreas</option>
            <option *ngFor="let a of areas$ | async" [value]="a.name">{{ a.name }}</option>
          </select>
          <select [(ngModel)]="filterStatus" class="filter-select">
            <option value="">Todos os Status</option>
            <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
          </select>
          <select [(ngModel)]="filterResp" class="filter-select">
            <option value="">Todos os Responsáveis</option>
            <option *ngFor="let u of users$ | async" [value]="u.name">{{ u.name }}</option>
          </select>
          <span class="count">{{ filtered.length }} resultado(s)</span>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div *ngIf="filtered.length === 0" class="empty">Nenhum cenário encontrado.</div>
          <div class="table-scroll" *ngIf="filtered.length > 0">
            <table>
              <thead>
                <tr>
                  <th>CT ID</th><th>Cenário</th><th>Funcionalidade</th>
                  <th>Área</th><th>Responsável</th><th>Data Planejada</th>
                  <th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of filtered">
                  <td class="ct-id">{{ s.ct_id }}</td>
                  <td class="scenario-col">{{ s.scenario }}</td>
                  <td>{{ s.feature }}</td>
                  <td>{{ s.area_name }}</td>
                  <td>{{ s.responsible_name }}</td>
                  <td>{{ s.planned_date | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge" [class]="getStatusClass(s.status)">
                      {{ getStatusLabel(s.status) }}
                    </span>
                  </td>
                  <td>
                    <button mat-icon-button (click)="openEdit(s)" matTooltip="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="!(locked$ | async)" (click)="delete(s)" matTooltip="Excluir" color="warn">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page  { display: flex; flex-direction: column; flex: 1; overflow-y: auto; }
    .content { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .filter-input { padding: 7px 12px; border: 0.5px solid rgba(0,0,0,.15); border-radius: 8px; font-size: 13px; }
    .filter-input.lg { min-width: 240px; }
    .filter-select { padding: 7px 10px; border: 0.5px solid rgba(0,0,0,.15); border-radius: 8px; font-size: 13px; background: white; }
    .count { font-size: 12px; color: #888780; margin-left: auto; }
    .table-card { background: white; border: 0.5px solid rgba(0,0,0,.08); border-radius: 12px; overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .empty { padding: 48px; text-align: center; color: #888780; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 500; color: #888780; text-transform: uppercase; letter-spacing: .04em; background: #f8f9fa; border-bottom: 0.5px solid rgba(0,0,0,.08); white-space: nowrap; }
    td { padding: 10px 14px; border-bottom: 0.5px solid rgba(0,0,0,.05); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }
    .ct-id { font-weight: 500; color: #185FA5; white-space: nowrap; }
    .scenario-col { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class ScenariosComponent implements OnInit {
  search       = ''
  filterArea   = ''
  filterStatus = ''
  filterResp   = ''
  filtered:    Scenario[] = []

  areas$   = this.store.select(selectAreas)
  users$   = this.store.select(selectUsers)
  locked$  = this.store.select(selectIsProjectLocked)

  statusOptions = Object.entries(SCENARIO_STATUS_LABELS).map(([v,l]) => ({ value: v, label: l }))

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.store.select(selectFilteredScenarios).subscribe(scenarios => {
      this.applyFilters(scenarios)
    })
  }

  applyFilters(scenarios: Scenario[]) {
    this.filtered = scenarios.filter(s => {
      if (this.filterArea   && s.area_name        !== this.filterArea)   return false
      if (this.filterStatus && s.status           !== this.filterStatus) return false
      if (this.filterResp   && s.responsible_name !== this.filterResp)   return false
      const q = this.search.toLowerCase()
      if (q && !s.ct_id.toLowerCase().includes(q) &&
               !s.scenario.toLowerCase().includes(q) &&
               !s.feature?.toLowerCase().includes(q)) return false
      return true
    })
  }

  getStatusLabel(status: string): string { return SCENARIO_STATUS_LABELS[status] ?? status }
  getStatusClass(status: string): string { return status.replace('_', '-') }

  openNew()        { /* open ScenarioDialogComponent */ }
  openEdit(s: Scenario) { /* open ScenarioDialogComponent with data */ }

  delete(s: Scenario) {
    if (!confirm(`Excluir cenário ${s.ct_id}?`)) return
    this.store.dispatch(deleteScenario({ id: s.id }))
    this.snack.open('Cenário excluído.', 'OK', { duration: 3000 })
  }

  exportExcel() {
    const rows = this.filtered.map(s => ({
      'CT ID': s.ct_id, 'EF ID': s.ef_id, 'Cenário': s.scenario,
      'Funcionalidade': s.feature, 'Área': s.area_name, 'Responsável': s.responsible_name,
      'Status': this.getStatusLabel(s.status),
      'Dado': s.gherkin?.dado, 'Quando': s.gherkin?.quando, 'Então': s.gherkin?.entao,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cenários')
    XLSX.writeFile(wb, 'cenarios-uat.xlsx')
    this.snack.open('Excel exportado.', 'OK', { duration: 3000 })
  }
}
