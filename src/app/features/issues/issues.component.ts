import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectFilteredIssues, selectAreas, selectUsers, selectScenarios, selectIsProjectLocked } from '../../core/services/store.selectors'
import { addIssue, updateIssue, deleteIssue } from '../../core/services/store.actions'
import { SEVERITY_LABELS, PRIORITY_LABELS, ISSUE_STATUS_LABELS } from '../../core/models/constants'
import type { Issue } from '../../core/models'
import * as XLSX from 'xlsx'

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Controle de Issues">
        <button mat-stroked-button (click)="exportExcel()"><mat-icon>download</mat-icon> Exportar</button>
        <button mat-flat-button color="primary" *ngIf="!(locked$ | async)" (click)="openNew()">
          <mat-icon>add</mat-icon> Nova Issue
        </button>
      </app-topbar>

      <div class="content">

        <!-- Filters -->
        <div class="filters">
          <input [(ngModel)]="search" placeholder="Buscar ID, título..." class="filter-input">
          <select [(ngModel)]="filterSev">
            <option value="">Todas as Severidades</option>
            <option *ngFor="let s of sevOptions" [value]="s.value">{{ s.label }}</option>
          </select>
          <select [(ngModel)]="filterPri">
            <option value="">Todas as Prioridades</option>
            <option *ngFor="let p of priOptions" [value]="p.value">{{ p.label }}</option>
          </select>
          <select [(ngModel)]="filterStatus">
            <option value="">Todos os Status</option>
            <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
          </select>
        </div>

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title"><mat-icon>{{ editingIssue ? 'edit' : 'bug_report' }}</mat-icon> {{ editingIssue ? 'Editar Issue' : 'Nova Issue' }}</h3>
          <div class="form-grid">
            <div class="form-field"><label>ID da Issue *</label><input [(ngModel)]="form.issue_id" placeholder="ISS-001"></div>
            <div class="form-field"><label>Cenário Relacionado</label>
              <select [(ngModel)]="form.scenario_ct">
                <option value="">Selecione...</option>
                <option *ngFor="let s of scenarios$ | async" [value]="s.ct_id">{{ s.ct_id }} — {{ s.scenario?.slice(0,40) }}</option>
              </select>
            </div>
            <div class="form-field full"><label>Título *</label><input [(ngModel)]="form.title" placeholder="Descrição resumida do defeito"></div>
            <div class="form-field full"><label>Descrição</label><textarea [(ngModel)]="form.description" rows="3"></textarea></div>
            <div class="form-field"><label>Área</label>
              <select [(ngModel)]="form.area_name">
                <option value="">Selecione...</option>
                <option *ngFor="let a of areas$ | async" [value]="a.name">{{ a.name }}</option>
              </select>
            </div>
            <div class="form-field"><label>Responsável</label>
              <select [(ngModel)]="form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of users$ | async" [value]="u.name">{{ u.name }}</option>
              </select>
            </div>
            <div class="form-field"><label>Severidade</label>
              <select [(ngModel)]="form.severity">
                <option *ngFor="let s of sevOptions" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Prioridade</label>
              <select [(ngModel)]="form.priority">
                <option *ngFor="let p of priOptions" [value]="p.value">{{ p.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Status</label>
              <select [(ngModel)]="form.status">
                <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Data de Abertura</label><input type="date" [(ngModel)]="form.opened_at"></div>
            <div class="form-field"><label>Prazo</label><input type="date" [(ngModel)]="form.deadline"></div>
            <div class="form-field full"><label>Observações</label><textarea [(ngModel)]="form.observations" rows="2"></textarea></div>
          </div>
          <div class="form-actions">
            <button mat-stroked-button (click)="closeForm()">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()"><mat-icon>save</mat-icon> {{ editingIssue ? 'Salvar' : 'Registrar Issue' }}</button>
          </div>
        </div>

        <!-- Table -->
        <div class="card">
          <div class="table-scroll">
            <table>
              <thead><tr><th>ID</th><th>Título</th><th>Cenário</th><th>Severidade</th><th>Prioridade</th><th>Status</th><th>Prazo</th><th>Responsável</th><th>Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let i of filteredIssues">
                  <td class="issue-id">{{ i.issue_id }}</td>
                  <td class="title-col">{{ i.title }}</td>
                  <td class="ct-ref">{{ i.scenario_ct || '—' }}</td>
                  <td><span class="badge" [class]="'sev-' + i.severity?.toLowerCase()">{{ i.severity }}</span></td>
                  <td><span class="badge" [class]="'pri-' + i.priority?.toLowerCase()">{{ i.priority }}</span></td>
                  <td><span class="badge" [class]="'ist-' + i.status">{{ getStatusLabel(i.status) }}</span></td>
                  <td [class.overdue]="isOverdue(i.deadline) && i.status !== 'encerrado'">{{ i.deadline | date:'dd/MM/yyyy' }}</td>
                  <td class="muted">{{ i.responsible_name }}</td>
                  <td>
                    <button mat-icon-button (click)="openEdit(i)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" *ngIf="!(locked$ | async)" (click)="remove(i)"><mat-icon>delete</mat-icon></button>
                  </td>
                </tr>
                <tr *ngIf="!filteredIssues.length"><td colspan="9" class="empty-cell">Nenhuma issue encontrada.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:14px; }
    .filters { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    .filter-input { padding:7px 12px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; min-width:200px; }
    .filters select { padding:7px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; background:white; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .form-card { border:1.5px solid #185FA5; background:#F8FBFF; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field.full { grid-column:1/-1; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input,.form-field select,.form-field textarea { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus,.form-field select:focus,.form-field textarea:focus { outline:none; border-color:#185FA5; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .table-scroll { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; padding:10px 14px; font-size:11px; font-weight:600; color:#888780; text-transform:uppercase; letter-spacing:.04em; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); white-space:nowrap; }
    td { padding:10px 14px; border-bottom:0.5px solid rgba(0,0,0,.05); vertical-align:middle; }
    tr:hover td { background:#fafafa; }
    .issue-id { font-weight:600; color:#A32D2D; white-space:nowrap; }
    .ct-ref { color:#185FA5; font-weight:500; }
    .title-col { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .muted { color:#888780; }
    .overdue { color:#A32D2D; font-weight:500; }
    .empty-cell { text-align:center; padding:32px; color:#888780; }
    .badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
    .sev-s1 { background:#E24B4A; color:#fff; }
    .sev-s2 { background:#F09595; color:#501313; }
    .sev-s3 { background:#EF9F27; color:#412402; }
    .sev-s4 { background:#FAC775; color:#633806; }
    .sev-s5 { background:#B5D4F4; color:#0C447C; }
    .pri-p1 { background:#E24B4A; color:#fff; }
    .pri-p2 { background:#EF9F27; color:#412402; }
    .pri-p3 { background:#FAC775; color:#633806; }
    .pri-p4 { background:#D3D1C7; color:#444441; }
    .ist-aberto      { background:#FAC775; color:#633806; }
    .ist-em_analise  { background:#B5D4F4; color:#0C447C; }
    .ist-em_correcao { background:#D8B4FE; color:#5B21B6; }
    .ist-homologando { background:#9FE1CB; color:#085041; }
    .ist-encerrado   { background:#C0DD97; color:#27500A; }
    .ist-cancelado   { background:#D3D1C7; color:#444441; }
    @media(max-width:768px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class IssuesComponent implements OnInit {
  showForm     = false
  editingIssue: Issue | null = null
  form: Partial<Issue> = {}
  search       = ''
  filterSev    = ''
  filterPri    = ''
  filterStatus = ''
  filteredIssues: Issue[] = []
  allIssues:      Issue[] = []

  locked$    = this.store.select(selectIsProjectLocked)
  areas$     = this.store.select(selectAreas)
  users$     = this.store.select(selectUsers)
  scenarios$ = this.store.select(selectScenarios)

  sevOptions    = Object.entries(SEVERITY_LABELS).map(([v,l]) => ({ value: v, label: l }))
  priOptions    = Object.entries(PRIORITY_LABELS).map(([v,l]) => ({ value: v, label: l }))
  statusOptions = Object.entries(ISSUE_STATUS_LABELS).map(([v,l]) => ({ value: v, label: l }))

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.store.select(selectFilteredIssues).subscribe(issues => {
      this.allIssues = issues
      this.applyFilters()
    })
  }

  applyFilters() {
    const q = this.search.toLowerCase()
    this.filteredIssues = this.allIssues.filter(i => {
      if (this.filterSev    && i.severity !== this.filterSev)    return false
      if (this.filterPri    && i.priority !== this.filterPri)    return false
      if (this.filterStatus && i.status   !== this.filterStatus) return false
      if (q && !i.issue_id.toLowerCase().includes(q) && !i.title.toLowerCase().includes(q)) return false
      return true
    })
  }

  getStatusLabel(s: string) { return ISSUE_STATUS_LABELS[s] ?? s }
  isOverdue(d?: string)     { return d ? new Date(d + 'T23:59:59') < new Date() : false }

  openNew()           { this.editingIssue = null; this.form = { issue_id:'', title:'', severity:'S3', priority:'P2', status:'aberto', opened_at: new Date().toISOString().slice(0,10) }; this.showForm = true }
  openEdit(i: Issue)  { this.editingIssue = i; this.form = { ...i }; this.showForm = true }
  closeForm()         { this.showForm = false; this.editingIssue = null; this.form = {} }

  save() {
    if (!this.form.issue_id || !this.form.title) { this.snack.open('ID e Título são obrigatórios.', 'OK', { duration: 3000 }); return }
    const now = new Date().toISOString()
    if (this.editingIssue) {
      this.store.dispatch(updateIssue({ issue: { ...this.editingIssue, ...this.form, updated_at: now } as Issue }))
      this.snack.open('Issue atualizada.', 'OK', { duration: 3000 })
    } else {
      this.store.dispatch(addIssue({ issue: { ...this.form, id: crypto.randomUUID(), created_at: now, updated_at: now } as Issue }))
      this.snack.open('Issue registrada.', 'OK', { duration: 3000 })
    }
    this.closeForm()
  }

  remove(i: Issue) {
    if (!confirm(`Excluir issue ${i.issue_id}?`)) return
    this.store.dispatch(deleteIssue({ id: i.id }))
    this.snack.open('Issue excluída.', 'OK', { duration: 3000 })
  }

  exportExcel() {
    const rows = this.filteredIssues.map(i => ({
      'ID': i.issue_id, 'Título': i.title, 'Cenário': i.scenario_ct,
      'Severidade': i.severity, 'Prioridade': i.priority,
      'Status': this.getStatusLabel(i.status),
      'Prazo': i.deadline, 'Responsável': i.responsible_name,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Issues')
    XLSX.writeFile(wb, 'issues-uat.xlsx')
    this.snack.open('Excel exportado.', 'OK', { duration: 3000 })
  }
}
