import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectUsers, selectIsProjectLocked } from '../../core/services/store.selectors'
import { addUser, updateUser, deleteUser } from '../../core/services/store.actions'
import type { User } from '../../core/models'
import { USER_ROLE_LABELS } from '../../core/models/constants'

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatTooltipModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Gestão de Usuários">
        <button class="btn-primary" *ngIf="!(locked$ | async)" (click)="openNew()">
          <mat-icon>add</mat-icon> Novo Usuário
        </button>
      </app-topbar>

      <div class="content">

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title">
            <mat-icon>{{ editingUser ? 'edit' : 'person_add' }}</mat-icon>
            {{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}
          </h3>
          <div class="form-grid">
            <div class="form-field">
              <label>Nome Completo *</label>
              <input [(ngModel)]="form.name" placeholder="Nome do usuário"
                [class.invalid]="formSubmitted && !form.name">
              <span *ngIf="formSubmitted && !form.name" class="error-msg">Nome é obrigatório</span>
            </div>
            <div class="form-field">
              <label>E-mail *</label>
              <input [(ngModel)]="form.email" type="email" placeholder="email@empresa.com"
                [class.invalid]="formSubmitted && !form.email">
              <span *ngIf="formSubmitted && !form.email" class="error-msg">E-mail é obrigatório</span>
            </div>
            <div class="form-field">
              <label>Perfil</label>
              <select [(ngModel)]="form.role">
                <option *ngFor="let r of roleOptions" [value]="r.value">{{ r.label }}</option>
              </select>
            </div>

            <!-- ITEM 2: Área somente leitura — atualizada automaticamente via Gestão de Áreas -->
            <div class="form-field">
              <label>
                Área
                <span class="readonly-hint">
                  <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">lock</mat-icon>
                  Gerenciado em Gestão de Áreas
                </span>
              </label>
              <div class="area-readonly">
                <span *ngIf="form.area_name" class="area-badge">{{ form.area_name }}</span>
                <span *ngIf="!form.area_name" class="area-empty">Nenhuma área vinculada</span>
              </div>
              <small class="field-hint">Para vincular este usuário a uma área, acesse Gestão de Áreas e adicione-o à área desejada.</small>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">
              <mat-icon>save</mat-icon> {{ editingUser ? 'Salvar' : 'Criar Usuário' }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div *ngIf="users.length === 0" class="empty-state">
            <mat-icon>people</mat-icon>
            <p>Nenhum usuário cadastrado.</p>
          </div>
          <div class="table-scroll" *ngIf="users.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Área <span class="th-hint">(via Gestão de Áreas)</span></th>
                  <th>Status</th>
                  <th style="width:80px">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users">
                  <td class="user-name">{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td><span class="role-badge">{{ getRoleLabel(u.role) }}</span></td>
                  <td>
                    <span *ngIf="u.area_name" class="area-badge-sm">{{ u.area_name }}</span>
                    <span *ngIf="!u.area_name" class="no-area">—</span>
                  </td>
                  <td>
                    <span class="status-badge" [class.active]="u.active !== false">
                      {{ u.active !== false ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="actions-col">
                    <button class="icon-btn" (click)="openEdit(u)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
                    <button class="icon-btn danger" (click)="remove(u)" matTooltip="Desativar"><mat-icon>person_off</mat-icon></button>
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
    .page { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:14px; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .form-card { border:1.5px solid #185FA5 !important; background:#F8FBFF !important; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
    .readonly-hint { font-size:10px; color:#888780; font-weight:400; display:flex; align-items:center; gap:2px; }
    .form-field input, .form-field select { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus { outline:none; border-color:#185FA5; }
    .form-field input.invalid { border-color:#A32D2D !important; }
    .error-msg { font-size:11px; color:#A32D2D; }
    .field-hint { font-size:11px; color:#888780; margin-top:2px; }
    .area-readonly { padding:8px 10px; border:0.5px solid rgba(0,0,0,.08); border-radius:8px; background:#f8f9fa; min-height:36px; display:flex; align-items:center; }
    .area-badge { background:#E6F1FB; color:#185FA5; font-size:12px; font-weight:500; padding:2px 10px; border-radius:8px; }
    .area-empty { color:#888780; font-size:12px; font-style:italic; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .table-card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; overflow:hidden; }
    .table-scroll { overflow-x:auto; }
    .empty-state { padding:48px; text-align:center; color:#888780; }
    .empty-state mat-icon { font-size:40px; width:40px; height:40px; display:block; margin:0 auto 8px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; padding:10px 14px; font-size:11px; font-weight:600; color:#888780; text-transform:uppercase; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); }
    .th-hint { font-size:9px; font-weight:400; color:#aaa; text-transform:none; }
    td { padding:10px 14px; border-bottom:0.5px solid rgba(0,0,0,.05); vertical-align:middle; }
    tr:hover td { background:#fafafa; }
    .user-name { font-weight:500; }
    .actions-col { white-space:nowrap; }
    .role-badge { background:#f5f5f5; color:#444; font-size:11px; padding:2px 8px; border-radius:8px; font-weight:500; }
    .area-badge-sm { background:#E6F1FB; color:#185FA5; font-size:11px; padding:2px 8px; border-radius:8px; font-weight:500; }
    .no-area { color:#ccc; }
    .status-badge { font-size:11px; padding:2px 8px; border-radius:8px; background:#f5f5f5; color:#888780; }
    .status-badge.active { background:#EAF3DE; color:#3B6D11; }
    @media(max-width:600px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class UsersComponent implements OnInit {
  showForm = false
  formSubmitted = false
  editingUser: User | null = null
  form: Partial<User> = {}
  users: User[] = []
  locked$ = this.store.select(selectIsProjectLocked)
  roleOptions = Object.entries(USER_ROLE_LABELS).map(([v,l]) => ({ value:v, label:l }))

  constructor(private store: Store, private snack: MatSnackBar) {}

  ngOnInit() {
    this.store.select(selectUsers).subscribe(u => this.users = u)
  }

  getRoleLabel(role: string) { return USER_ROLE_LABELS[role] ?? role }

  openNew() {
    this.editingUser = null
    this.formSubmitted = false
    this.form = { name:'', email:'', role:'executor', area_name:'' }
    this.showForm = true
  }

  openEdit(u: User) {
    this.editingUser = u
    this.formSubmitted = false
    this.form = { ...u }
    this.showForm = true
  }

  closeForm() { this.showForm = false; this.editingUser = null; this.form = {}; this.formSubmitted = false }

  save() {
    this.formSubmitted = true
    if (!this.form.name)  { this.snack.open('Nome é obrigatório.','OK',{duration:3000}); return }
    if (!this.form.email) { this.snack.open('E-mail é obrigatório.','OK',{duration:3000}); return }

    if (this.editingUser) {
      // Preservar area_name — não pode ser alterado aqui
      this.store.dispatch(updateUser({ user: { ...this.editingUser, ...this.form, area_name: this.editingUser.area_name } as User }))
      this.snack.open('Usuário atualizado.','OK',{duration:3000})
    } else {
      this.store.dispatch(addUser({ user: { ...this.form, id:crypto.randomUUID(), active:true, created_at:new Date().toISOString(), area_name:'' } as User }))
      this.snack.open('Usuário criado.','OK',{duration:3000})
    }
    this.closeForm()
  }

  remove(u: User) {
    if (!confirm(`Desativar usuário "${u.name}"?`)) return
    this.store.dispatch(updateUser({ user: { ...u, active: false } }))
    this.snack.open('Usuário desativado.','OK',{duration:3000})
  }
}
