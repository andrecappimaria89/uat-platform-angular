import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectUsers, selectAreas } from '../../core/services/store.selectors'
import { addUser, updateUser, deleteUser } from '../../core/services/store.actions'
import type { User } from '../../core/models'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', gestor: 'Gestor',
  executor: 'Executor',   stakeholder: 'Somente Leitura',
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Gestão de Usuários">
        <button mat-flat-button color="primary" (click)="openNew()">
          <mat-icon>add</mat-icon> Novo Usuário
        </button>
      </app-topbar>

      <div class="content">

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title">
            <mat-icon>{{ editingUser ? 'edit' : 'person_add' }}</mat-icon>
            {{ editingUser ? 'Editar Usuário — ' + editingUser.name : 'Novo Usuário' }}
          </h3>
          <div class="form-grid">
            <div class="form-field"><label>Nome Completo *</label><input [(ngModel)]="form.name" placeholder="Nome completo"></div>
            <div class="form-field"><label>E-mail *</label><input type="email" [(ngModel)]="form.email" placeholder="email@empresa.com"></div>
            <div class="form-field">
              <label>Área</label>
              <select [(ngModel)]="form.area_name">
                <option value="">Selecione...</option>
                <option *ngFor="let a of areas$ | async" [value]="a.name">{{ a.name }}</option>
              </select>
            </div>
            <div class="form-field" *ngIf="editingUser">
              <label>Perfil de Acesso</label>
              <select [(ngModel)]="form.role">
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="executor">Executor</option>
                <option value="stakeholder">Somente Leitura</option>
              </select>
            </div>
            <div *ngIf="!editingUser" class="info-box full">
              <mat-icon>info</mat-icon>
              Novo usuário criado com perfil <strong>Executor</strong> por padrão. Um Administrador pode alterar o perfil posteriormente.
            </div>
          </div>
          <div class="form-actions">
            <button mat-stroked-button (click)="closeForm()">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()">
              <mat-icon>save</mat-icon> {{ editingUser ? 'Salvar Alterações' : 'Criar Usuário' }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="card">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Área</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users$ | async">
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ u.avatar_initials }}</div>
                      <span>{{ u.name }}</span>
                    </div>
                  </td>
                  <td class="muted">{{ u.email }}</td>
                  <td><span class="badge" [class]="'role-' + u.role">{{ getRoleLabel(u.role) }}</span></td>
                  <td class="muted">{{ u.area_name || '—' }}</td>
                  <td><span class="badge" [class]="u.active ? 'status-ativo' : 'status-inativo'">{{ u.active ? 'Ativo' : 'Inativo' }}</span></td>
                  <td>
                    <button mat-icon-button (click)="openEdit(u)" title="Editar"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="remove(u)" title="Desativar"><mat-icon>person_off</mat-icon></button>
                  </td>
                </tr>
                <tr *ngIf="!(users$ | async)?.length">
                  <td colspan="6" class="empty-cell">Nenhum usuário cadastrado.</td>
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
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .form-card { border:1.5px solid #185FA5; background:#F8FBFF; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:16px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-field { display:flex; flex-direction:column; gap:4px; }
    .form-field.full, .info-box.full { grid-column:1/-1; }
    .form-field label { font-size:12px; color:#888780; font-weight:500; }
    .form-field input, .form-field select { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus { outline:none; border-color:#185FA5; }
    .info-box { display:flex; align-items:center; gap:8px; background:#E6F1FB; color:#0C447C; padding:10px 14px; border-radius:8px; font-size:12px; }
    .info-box mat-icon { font-size:16px; width:16px; height:16px; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .table-scroll { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; padding:10px 14px; font-size:11px; font-weight:600; color:#888780; text-transform:uppercase; letter-spacing:.04em; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); }
    td { padding:10px 14px; border-bottom:0.5px solid rgba(0,0,0,.05); vertical-align:middle; }
    tr:hover td { background:#fafafa; }
    .user-cell { display:flex; align-items:center; gap:8px; }
    .avatar { width:30px; height:30px; border-radius:50%; background:#E6F1FB; color:#185FA5; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .muted { color:#888780; }
    .empty-cell { text-align:center; padding:32px; color:#888780; }
    .badge { display:inline-flex; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:500; }
    .role-admin       { background:#B5D4F4; color:#0C447C; }
    .role-gestor      { background:#C0DD97; color:#27500A; }
    .role-executor    { background:#D3D1C7; color:#444441; }
    .role-stakeholder { background:#B5D4F4; color:#0C447C; }
    .status-ativo     { background:#C0DD97; color:#27500A; }
    .status-inativo   { background:#D3D1C7; color:#444441; }
    @media(max-width:768px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class UsersComponent implements OnInit {
  showForm    = false
  editingUser: User | null = null
  form: Partial<User> = {}

  users$ = this.store.select(selectUsers)
  areas$ = this.store.select(selectAreas)

  constructor(private store: Store, private snack: MatSnackBar) {}
  ngOnInit() {}

  getRoleLabel(role: string): string { return ROLE_LABELS[role] ?? role }

  openNew()       { this.editingUser = null; this.form = { name: '', email: '', area_name: '', role: 'executor' }; this.showForm = true }
  openEdit(u: User) { this.editingUser = u; this.form = { ...u }; this.showForm = true }
  closeForm()     { this.showForm = false; this.editingUser = null; this.form = {} }

  save() {
    if (!this.form.name || !this.form.email) {
      this.snack.open('Nome e e-mail são obrigatórios.', 'OK', { duration: 3000 }); return
    }
    const initials = this.form.name!.trim().split(' ').filter(Boolean)
      .map(w => w[0]).slice(0, 2).join('').toUpperCase()

    if (this.editingUser) {
      this.store.dispatch(updateUser({ user: { ...this.editingUser, ...this.form, avatar_initials: initials } as User }))
      this.snack.open('Usuário atualizado.', 'OK', { duration: 3000 })
    } else {
      this.store.dispatch(addUser({ user: {
        ...this.form, id: crypto.randomUUID(),
        role: 'executor', avatar_initials: initials,
        active: true, created_at: new Date().toISOString(),
      } as User }))
      this.snack.open('Usuário criado com perfil Executor.', 'OK', { duration: 3000 })
    }
    this.closeForm()
  }

  remove(u: User) {
    if (!confirm(`Desativar usuário "${u.name}"?`)) return
    this.store.dispatch(deleteUser({ id: u.id }))
    this.snack.open('Usuário desativado.', 'OK', { duration: 3000 })
  }
}
