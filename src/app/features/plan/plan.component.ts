// plan.component.ts
import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectSelectedPlan, selectIsProjectLocked, selectScenarios, selectAreas, selectSelectedPlanId } from '../../core/services/store.selectors'
import { updatePlan, addPlan, concludePlan } from '../../core/services/store.actions'
import type { TestPlan } from '../../core/models'

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Plano de Testes">
        <button mat-stroked-button (click)="openNew()"><mat-icon>add</mat-icon> Novo Plano</button>
        <button mat-stroked-button *ngIf="!(locked$ | async) && !editing" (click)="editing=true"><mat-icon>edit</mat-icon> Editar</button>
        <button mat-flat-button color="warn" *ngIf="!(locked$ | async) && !editing" (click)="conclude()"><mat-icon>check_circle</mat-icon> Concluir</button>
        <button mat-flat-button color="primary" *ngIf="editing" (click)="save()"><mat-icon>save</mat-icon> Salvar</button>
        <button mat-stroked-button *ngIf="editing" (click)="editing=false"><mat-icon>close</mat-icon> Cancelar</button>
      </app-topbar>
      <div class="content">
        <div *ngIf="locked$ | async" class="lock-banner">
          <mat-icon>lock</mat-icon>
          Projeto concluído — somente visualização
        </div>
        <ng-container *ngIf="plan$ | async as p">
          <div class="form-grid">
            <div class="form-field"><label>Projeto *</label><input [(ngModel)]="form.project" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field"><label>Área Responsável</label><input [(ngModel)]="form.responsible_area" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field"><label>Data de Início</label><input type="date" [(ngModel)]="form.start_date" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field"><label>Data de Término</label><input type="date" [(ngModel)]="form.end_date" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field"><label>Sistemas Envolvidos</label><input [(ngModel)]="form.systems" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field"><label>Ambientes</label><input [(ngModel)]="form.environments" [readonly]="!editing || !!(locked$ | async)"></div>
            <div class="form-field full"><label>Objetivo do UAT *</label><textarea [(ngModel)]="form.objective" [readonly]="!editing || !!(locked$ | async)"></textarea></div>
            <div class="form-field full"><label>Escopo</label><textarea [(ngModel)]="form.scope" [readonly]="!editing || !!(locked$ | async)"></textarea></div>
            <div class="form-field full"><label>Critérios de Entrada</label><textarea [(ngModel)]="form.entry_criteria" [readonly]="!editing || !!(locked$ | async)"></textarea></div>
            <div class="form-field full"><label>Critérios de Saída</label><textarea [(ngModel)]="form.exit_criteria" [readonly]="!editing || !!(locked$ | async)"></textarea></div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; flex: 1; overflow-y: auto; }
    .content { padding: 24px; max-width: 960px; }
    .lock-banner { display: flex; align-items: center; gap: 8px; background: #FAEEDA; color: #854F0B; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field.full { grid-column: 1 / -1; }
    .form-field label { font-size: 12px; color: #888780; }
    .form-field input, .form-field textarea { padding: 8px 10px; border: 0.5px solid rgba(0,0,0,.15); border-radius: 8px; font-size: 13px; font-family: inherit; }
    .form-field textarea { min-height: 80px; resize: vertical; }
  `],
})
export class PlanComponent {
  editing = false
  form: Partial<TestPlan> = {}
  plan$   = this.store.select(selectSelectedPlan)
  locked$ = this.store.select(selectIsProjectLocked)

  constructor(private store: Store, private snack: MatSnackBar) {
    this.plan$.subscribe(p => { if (p) this.form = { ...p } })
  }

  save() {
    this.store.dispatch(updatePlan({ plan: { ...this.form, updated_at: new Date().toISOString() } as TestPlan }))
    this.editing = false
    this.snack.open('Plano atualizado.', 'OK', { duration: 3000 })
  }

  conclude() {
    if (!confirm('Concluir projeto? Esta ação é irreversível.')) return
    this.plan$.subscribe(p => {
      if (p) this.store.dispatch(concludePlan({ id: p.id }))
    }).unsubscribe()
    this.snack.open('Projeto concluído.', 'OK', { duration: 4000 })
  }

  openNew() { /* Open dialog for new plan */ }
}
