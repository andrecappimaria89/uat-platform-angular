import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectAreas, selectUsers, selectScenarios, selectSelectedPlanId, selectIsProjectLocked } from '../../core/services/store.selectors'
import { addArea, updateArea, deleteArea, updateUser } from '../../core/services/store.actions'
import type { Area } from '../../core/models'
import { map, combineLatest } from 'rxjs'

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Gestão de Áreas">
        <button class="btn-primary" *ngIf="!(locked$ | async)" (click)="openNew()">
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
            <div class="form-field"><label>Nome da Área *</label>
              <input [(ngModel)]="form.name" placeholder="Ex: Financeiro" [class.invalid]="formSubmitted && !form.name">
              <span *ngIf="formSubmitted && !form.name" class="error-msg">Nome é obrigatório</span>
              <span *ngIf="duplicateNameError" class="error-msg">{{ duplicateNameError }}</span>
            </div>
            <div class="form-field">
              <label>Responsável Principal *</label>
              <select [(ngModel)]="form.responsible_name" class="select-required" [class.invalid]="formSubmitted && !form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of users" [value]="u.name">{{ u.name }}</option>
              </select>
              <span *ngIf="formSubmitted && !form.responsible_name" class="error-msg">Responsável é obrigatório</span>
            </div>

            <!-- Múltiplos usuários vinculados à área -->
            <div class="form-field full">
              <label>Usuários da Área <span class="required-hint">(1 ou mais — opcional além do responsável)</span></label>
              <div class="multi-select-box">
                <label *ngFor="let u of users" class="checkbox-row">
                  <input type="checkbox"
                    [checked]="selectedMembers.includes(u.name)"
                    (change)="toggleMember(u.name)">
                  <span>{{ u.name }}</span>
                  <span class="role-tag" *ngIf="u.name === form.responsible_name">Responsável</span>
                </label>
                <p *ngIf="users.length === 0" class="info-msg">Nenhum usuário cadastrado ainda.</p>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">
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
                <p class="area-resp">Responsável: {{ a.responsible_name || '—' }}</p>
                <p class="area-members" *ngIf="a.members?.length">
                  <mat-icon>group</mat-icon> {{ a.members.length }} usuário(s) vinculado(s)
                </p>
              </div>
              <div class="area-actions" *ngIf="!(locked$ | async)">
                <button class="icon-btn" (click)="openEdit(a)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
                <button class="icon-btn danger" (click)="remove(a)" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
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
    .form-field.full { grid-column:1/-1; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input, .form-field select { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus { outline:none; border-color:#185FA5; }
    .form-field input.invalid, .select-required.invalid { border-color:#A32D2D !important; }
    .error-msg { font-size:11px; color:#A32D2D; }
    .required-hint { font-size:11px; color:#185FA5; font-weight:400; }
    .multi-select-box { border:0.5px solid rgba(0,0,0,.15); border-radius:8px; max-height:160px; overflow-y:auto; padding:6px; }
    .checkbox-row { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; font-size:13px; }
    .checkbox-row:hover { background:#f5f5f5; }
    .checkbox-row input { cursor:pointer; }
    .role-tag { margin-left:auto; font-size:10px; background:#E6F1FB; color:#185FA5; padding:1px 6px; border-radius:8px; font-weight:600; }
    .info-msg { font-size:12px; color:#854F0B; padding:6px; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .areas-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:14px; }
    .area-card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:16px; }
    .area-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .area-name { font-size:14px; font-weight:500; }
    .area-resp { font-size:12px; color:#888780; margin-top:2px; }
    .area-members { font-size:11px; color:#185FA5; margin-top:4px; display:flex; align-items:center; gap:4px; }
    .area-members mat-icon { font-size:13px; width:13px; height:13px; }
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
  showForm = false; formSubmitted = false
  editingArea: Area | null = null
  form: Partial<Area> = {}
  selectedMembers: string[] = []

  areas$         = this.store.select(selectAreas)
  users:any[]    = []
  allAreas:any[] = []
  locked$        = this.store.select(selectIsProjectLocked)
  duplicateNameError = ''

  areaStats$ = combineLatest([
    this.store.select(selectAreas),
    this.store.select(selectScenarios),
    this.store.select(selectSelectedPlanId),
    this.store.select(selectUsers),
  ]).pipe(map(([areas, scenarios, planId, users]) =>
    areas.map(a => {
      const s        = scenarios.filter(sc => sc.area_name === a.name && (!planId || sc.project_id === planId))
      const total    = s.length
      const success  = s.filter(sc => sc.status === 'sucesso').length
      const blocked  = s.filter(sc => sc.status === 'bloqueado').length
      const executed = s.filter(sc => sc.status !== 'todo').length
      const pct      = total > 0 ? Math.round((success / total) * 100) : 0
      const rawMembers = (a as any).members ?? []
      // FIX: filtrar apenas membros que ainda existem como usuários cadastrados
      const userNames = users.map((u:any) => u.name)
      const members = rawMembers.filter((m: string) => userNames.includes(m))
      return { ...a, total, success, blocked, executed, pct, members }
    })
  ))

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.store.select(selectUsers).subscribe(u => this.users = u)
    this.store.select(selectAreas).subscribe(a => this.allAreas = a)
  }

  openNew() { this.editingArea=null; this.formSubmitted=false; this.form={ name:'', responsible_name:'' }; this.selectedMembers=[]; this.showForm=true }
  openEdit(a: any) {
    this.editingArea=a; this.formSubmitted=false
    this.form={ name:a.name, responsible_name:a.responsible_name ?? '' }
    this.selectedMembers = a.members ?? []
    this.showForm=true
  }
  closeForm() { this.showForm=false; this.editingArea=null; this.form={}; this.selectedMembers=[]; this.formSubmitted=false }

  toggleMember(name: string) {
    this.selectedMembers = this.selectedMembers.includes(name)
      ? this.selectedMembers.filter(m => m !== name)
      : [...this.selectedMembers, name]
  }

  save() {
    this.formSubmitted = true
    this.duplicateNameError = ''

    if (!this.form.name)             { this.snack.open('Nome é obrigatório.','OK',{duration:3000}); return }
    if (!this.form.responsible_name) { this.snack.open('Responsável é obrigatório.','OK',{duration:3000}); return }

    // ITEM 1: Validação de duplicidade (case-insensitive, ignora espaços extras)
    const normalizedNew = this.form.name.trim().toLowerCase()
    const duplicate = this.allAreas.find(a => {
      const isSelf = this.editingArea && a.id === this.editingArea.id
      return !isSelf && a.name.trim().toLowerCase() === normalizedNew
    })
    if (duplicate) {
      this.duplicateNameError = `Já existe uma área com esse nome: "${duplicate.name}".`
      this.snack.open(this.duplicateNameError, 'OK', { duration: 4000 })
      return
    }

    // Garante que o responsável principal está sempre na lista de membros
    const members = this.selectedMembers.includes(this.form.responsible_name!)
      ? this.selectedMembers
      : [...this.selectedMembers, this.form.responsible_name!]

    if (this.editingArea) {
      const updated = { ...this.editingArea, ...this.form, name: this.form.name!.trim(), members } as any
      this.store.dispatch(updateArea({ area: updated }))
      this.syncUsersAreaName(updated.name, members)
      this.snack.open('Área atualizada.','OK',{duration:3000})
    } else {
      const newArea = { id: crypto.randomUUID(), ...this.form, name: this.form.name!.trim(), members, created_at: new Date().toISOString() } as any
      this.store.dispatch(addArea({ area: newArea }))
      this.syncUsersAreaName(newArea.name, members)
      this.snack.open('Área criada.','OK',{duration:3000})
    }
    this.closeForm()
  }

  // ITEM 2: Atualiza area_name de todos os usuários ao vincular/desvincular
  private syncUsersAreaName(areaName: string, members: string[]) {
    this.users.forEach(user => {
      const shouldBeMember     = members.includes(user.name)
      const isInThisArea       = user.area_name === areaName
      if (shouldBeMember && !isInThisArea) {
        this.store.dispatch(updateUser({ user: { ...user, area_name: areaName } }))
      } else if (!shouldBeMember && isInThisArea) {
        this.store.dispatch(updateUser({ user: { ...user, area_name: '' } }))
      }
    })
  }

  remove(a: Area) {
    if (!confirm(`Excluir área "${a.name}"?`)) return
    // Desvincular usuários antes de excluir
    const members = (a as any).members ?? []
    members.forEach((name: string) => {
      const user = this.users.find(u => u.name === name && u.area_name === a.name)
      if (user) this.store.dispatch(updateUser({ user: { ...user, area_name: '' } }))
    })
    this.store.dispatch(deleteArea({ id: a.id }))
    this.snack.open('Área excluída.','OK',{duration:3000})
  }
}
