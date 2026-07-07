import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatDialogModule, MatDialog } from '@angular/material/dialog'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectSelectedPlan, selectIsProjectLocked, selectPlans, selectAreas, selectScenarios, selectSelectedPlanId } from '../../core/services/store.selectors'
import { updatePlan, addPlan, concludePlan } from '../../core/services/store.actions'
import type { TestPlan } from '../../core/models'

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatDialogModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Plano de Testes">
        <button class="btn-outline" (click)="openNewForm()">
          <mat-icon>add</mat-icon> Novo Plano
        </button>
        <ng-container *ngIf="plan$ | async as p">
          <button class="btn-outline" *ngIf="!(locked$ | async) && !editing && p?.id" (click)="startEdit(p)">
            <mat-icon>edit</mat-icon> Editar
          </button>
          <button class="btn-success" *ngIf="!(locked$ | async) && !editing && p?.id" (click)="conclude(p)">
            <mat-icon>check_circle</mat-icon> Concluir
          </button>
        </ng-container>
        <button class="btn-primary" *ngIf="editing" (click)="save()">
          <mat-icon>save</mat-icon> Salvar
        </button>
        <button class="btn-outline" *ngIf="editing" (click)="cancelEdit()">
          <mat-icon>close</mat-icon> Cancelar
        </button>
      </app-topbar>

      <div class="content">

        <!-- Lock banner -->
        <div *ngIf="locked$ | async" class="lock-banner">
          <mat-icon>lock</mat-icon>
          Projeto concluído em {{ (plan$ | async)?.concluded_at | date:'dd/MM/yyyy' }} — somente visualização
        </div>

        <!-- Novo Plano Form -->
        <div *ngIf="showNewForm" class="card new-plan-card form-card">
          <h3 class="card-title"><mat-icon>add_circle</mat-icon> Criar Novo Plano de Testes</h3>
          <div class="form-grid">
            <div class="form-field"><label>Projeto *</label><input [(ngModel)]="newForm.project" placeholder="Nome do projeto"></div>
            <div class="form-field"><label>Área Responsável</label><input [(ngModel)]="newForm.responsible_area"></div>
            <div class="form-field"><label>Data de Início</label><input type="date" [(ngModel)]="newForm.start_date"></div>
            <div class="form-field"><label>Data de Término</label><input type="date" [(ngModel)]="newForm.end_date"></div>
            <div class="form-field"><label>Sistemas Envolvidos</label><input [(ngModel)]="newForm.systems"></div>
            <div class="form-field"><label>Ambientes</label><input [(ngModel)]="newForm.environments" placeholder="QA, HML, UAT"></div>
            <div class="form-field"><label>Stakeholders</label><input [(ngModel)]="newForm.stakeholders"></div>
            <div class="form-field"><label>Responsáveis pela Execução</label><input [(ngModel)]="newForm.executors"></div>
            <div class="form-field full"><label>Objetivo do UAT *</label><textarea [(ngModel)]="newForm.objective" rows="3"></textarea></div>
            <div class="form-field full"><label>Escopo</label><textarea [(ngModel)]="newForm.scope" rows="2"></textarea></div>
            <div class="form-field full"><label>Premissas</label><textarea [(ngModel)]="newForm.premises" rows="2"></textarea></div>
            <div class="form-field full"><label>Dependências</label><textarea [(ngModel)]="newForm.dependencies" rows="2"></textarea></div>
            <div class="form-field full"><label>Riscos</label><textarea [(ngModel)]="newForm.risks" rows="2"></textarea></div>
            <div class="form-field full"><label>Critérios de Entrada</label><textarea [(ngModel)]="newForm.entry_criteria" rows="2"></textarea></div>
            <div class="form-field full"><label>Critérios de Saída</label><textarea [(ngModel)]="newForm.exit_criteria" rows="2"></textarea></div>
            <div class="form-field full"><label>Observações</label><textarea [(ngModel)]="newForm.observations" rows="2"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="showNewForm = false">Cancelar</button>
            <button class="btn-primary" (click)="createPlan()">
              <mat-icon>save</mat-icon> Criar Plano
            </button>
          </div>
        </div>

        <!-- Plan Details -->
        <ng-container *ngIf="plan$ | async as p">
          <div *ngIf="p" class="card">
            <h3 class="card-title"><mat-icon>assignment</mat-icon> Plano Atual — {{ p.project }}</h3>
            <div class="form-grid">
              <div class="form-field"><label>Projeto *</label><input [(ngModel)]="editForm.project" [readonly]="!editing"></div>
              <div class="form-field"><label>Área Responsável</label><input [(ngModel)]="editForm.responsible_area" [readonly]="!editing"></div>
              <div class="form-field"><label>Data de Início</label><input type="date" [(ngModel)]="editForm.start_date" [readonly]="!editing"></div>
              <div class="form-field"><label>Data de Término</label><input type="date" [(ngModel)]="editForm.end_date" [readonly]="!editing"></div>
              <div class="form-field"><label>Sistemas Envolvidos</label><input [(ngModel)]="editForm.systems" [readonly]="!editing"></div>
              <div class="form-field"><label>Ambientes</label><input [(ngModel)]="editForm.environments" [readonly]="!editing"></div>
              <div class="form-field"><label>Stakeholders</label><input [(ngModel)]="editForm.stakeholders" [readonly]="!editing"></div>
              <div class="form-field"><label>Responsáveis pela Execução</label><input [(ngModel)]="editForm.executors" [readonly]="!editing"></div>
              <div class="form-field full"><label>Objetivo do UAT *</label><textarea [(ngModel)]="editForm.objective" [readonly]="!editing" rows="3"></textarea></div>
              <div class="form-field full"><label>Escopo</label><textarea [(ngModel)]="editForm.scope" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Premissas</label><textarea [(ngModel)]="editForm.premises" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Dependências</label><textarea [(ngModel)]="editForm.dependencies" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Riscos</label><textarea [(ngModel)]="editForm.risks" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Critérios de Entrada</label><textarea [(ngModel)]="editForm.entry_criteria" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Critérios de Saída</label><textarea [(ngModel)]="editForm.exit_criteria" [readonly]="!editing" rows="2"></textarea></div>
              <div class="form-field full"><label>Observações</label><textarea [(ngModel)]="editForm.observations" [readonly]="!editing" rows="2"></textarea></div>
            </div>
          </div>
          <div *ngIf="!p" class="empty-state">
            <mat-icon>assignment</mat-icon>
            <p>Nenhum plano de testes encontrado.</p>
            <button class="btn-primary" (click)="openNewForm()">
              <mat-icon>add</mat-icon> Criar Primeiro Plano
            </button>
          </div>
        </ng-container>

        <!-- All plans list -->
        <div class="card" *ngIf="(plans$ | async)?.length">
          <h3 class="card-title"><mat-icon>list</mat-icon> Todos os Planos</h3>
          <table class="plans-table">
            <thead><tr><th>Projeto</th><th>Início</th><th>Término</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of plans$ | async" [class.selected-row]="p.id === (selectedPlanId$ | async)">
                <td>{{ p.project }}</td>
                <td>{{ p.start_date | date:'dd/MM/yyyy' }}</td>
                <td>{{ p.end_date   | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="status-badge" [class.concluido]="p.status === 'concluido'" [class.aberto]="p.status !== 'concluido'">
                    {{ p.status === 'concluido' ? '✓ Concluído' : 'Aberto' }}
                  </span>
                </td>
                <td>
                  <button class="btn-select" [class.active]="p.id === (selectedPlanId$ | async)" (click)="selectThisPlan(p.id)">
                    {{ p.id === (selectedPlanId$ | async) ? 'Selecionado' : 'Selecionar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; max-width:960px; }
    .lock-banner { display:flex; align-items:center; gap:8px; background:#FAEEDA; color:#854F0B; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:500; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .new-plan-card { border:1.5px solid #185FA5; background:#F8FBFF; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field.full { grid-column:1/-1; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input, .form-field textarea { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; transition:.15s; }
    .form-field input:focus, .form-field textarea:focus { outline:none; border-color:#185FA5; box-shadow:0 0 0 2px rgba(24,95,165,.1); }
    .form-field input[readonly], .form-field textarea[readonly] { background:#f8f9fa; color:#444; }
    .form-field textarea { resize:vertical; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .empty-state { text-align:center; padding:48px; color:#888780; }
    .empty-state mat-icon { font-size:48px; width:48px; height:48px; margin-bottom:12px; }
    .empty-state p { margin-bottom:16px; }
    .plans-table { width:100%; border-collapse:collapse; font-size:13px; }
    .plans-table th { text-align:left; padding:10px 12px; font-size:11px; font-weight:600; color:#888780; text-transform:uppercase; letter-spacing:.04em; border-bottom:0.5px solid rgba(0,0,0,.08); }
    .plans-table td { padding:10px 12px; border-bottom:0.5px solid rgba(0,0,0,.05); }
    .plans-table tr:hover td { background:#fafafa; }
    .selected-row td { background:#E6F1FB !important; }
    .status-badge { display:inline-flex; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:500; }
    .status-badge.concluido { background:#C0DD97; color:#27500A; }
    .status-badge.aberto    { background:#B5D4F4; color:#0C447C; }
    @media(max-width:768px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class PlanComponent implements OnInit {
  editing     = false
  showNewForm = false
  editForm:   Partial<TestPlan> = {}
  newForm:    Partial<TestPlan> = {}

  plan$           = this.store.select(selectSelectedPlan)
  plans$          = this.store.select(selectPlans)
  locked$         = this.store.select(selectIsProjectLocked)
  selectedPlanId$ = this.store.select(selectSelectedPlanId)

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.plan$.subscribe(p => { if (p) this.editForm = { ...p } })
    this.resetNewForm()
  }

  resetNewForm() {
    this.newForm = {
      project: '', objective: '', scope: '', systems: '',
      responsible_area: '', stakeholders: '', executors: '',
      start_date: '', end_date: '', environments: '',
      premises: '', dependencies: '', risks: '',
      entry_criteria: '', exit_criteria: '', observations: '',
      status: 'aberto',
    }
  }

  openNewForm() {
    this.showNewForm = !this.showNewForm
    this.editing = false
    if (this.showNewForm) {
      setTimeout(() => document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  startEdit(p: TestPlan) { this.editForm = { ...p }; this.editing = true }
  cancelEdit()           { this.plan$.subscribe(p => { if (p) this.editForm = { ...p } }).unsubscribe(); this.editing = false }

  save() {
    if (!this.editForm.project) { this.snack.open('Projeto é obrigatório.', 'OK', { duration: 3000 }); return }
    this.store.dispatch(updatePlan({ plan: { ...this.editForm, updated_at: new Date().toISOString() } as TestPlan }))
    this.editing = false
    this.snack.open('Plano atualizado.', 'OK', { duration: 3000 })
  }

  createPlan() {
    if (!this.newForm.project) { this.snack.open('Projeto é obrigatório.', 'OK', { duration: 3000 }); return }
    const plan: TestPlan = {
      ...this.newForm as TestPlan,
      id:         crypto.randomUUID(),
      status:     'aberto',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.store.dispatch(addPlan({ plan }))
    this.showNewForm = false
    this.resetNewForm()
    this.snack.open('Salvando plano...', undefined, { duration: 2000 })
  }

  conclude(p: TestPlan) {
    if (!confirm(`Concluir o projeto "${p.project}"? Esta ação é irreversível.`)) return
    this.store.dispatch(concludePlan({ id: p.id }))
    this.snack.open('Projeto concluído. Dados bloqueados para edição.', 'OK', { duration: 4000 })
  }

  selectThisPlan(id: string) {
    this.store.dispatch({ type: '[Plan] Select', id })
  }
}
