import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Histórico de Versões">
        <button mat-flat-button color="primary" (click)="showForm = !showForm">
          <mat-icon>add</mat-icon> Nova Versão
        </button>
      </app-topbar>

      <div class="content">

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title"><mat-icon>add_circle</mat-icon> Registrar Nova Versão</h3>
          <div class="form-grid">
            <div class="form-field"><label>Versão *</label><input [(ngModel)]="form.version" placeholder="v3.2"></div>
            <div class="form-field"><label>Data *</label><input type="date" [(ngModel)]="form.date"></div>
            <div class="form-field full"><label>Responsável</label>
              <select [(ngModel)]="form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of users" [value]="u.name">{{ u.name }}</option>
              </select>
            </div>
            <div class="form-field full"><label>Descrição *</label>
              <textarea [(ngModel)]="form.description" rows="2"></textarea>
            </div>
            <div class="form-field full"><label>Justificativa</label>
              <textarea [(ngModel)]="form.justification" rows="2"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button mat-stroked-button (click)="showForm = false">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()">
              <mat-icon>save</mat-icon> Salvar Versão
            </button>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <div class="timeline">
            <div class="timeline-item" *ngFor="let v of versions; let i = index">
              <div class="timeline-dot" [class.latest]="i === 0"></div>
              <div class="timeline-content">
                <div class="version-header">
                  <span class="version-badge">{{ v.version }}</span>
                  <span class="version-meta">{{ v.date | date:'dd/MM/yyyy' }} · {{ v.responsible_name }}</span>
                </div>
                <p class="version-desc">{{ v.description }}</p>
                <p class="version-just" *ngIf="v.justification">{{ v.justification }}</p>
              </div>
            </div>
            <div *ngIf="versions.length === 0" class="empty">Nenhuma versão registrada.</div>
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
    .form-field input, .form-field select, .form-field textarea { padding:8px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; font-family:inherit; }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus { outline:none; border-color:#185FA5; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:16px; border-top:0.5px solid rgba(0,0,0,.08); }
    .timeline { display:flex; flex-direction:column; }
    .timeline-item { display:flex; gap:16px; padding:16px 0; border-bottom:0.5px solid rgba(0,0,0,.05); }
    .timeline-item:last-child { border-bottom:none; }
    .timeline-dot { width:12px; height:12px; min-width:12px; border-radius:50%; background:#888780; margin-top:4px; }
    .timeline-dot.latest { background:#3B6D11; }
    .timeline-content { flex:1; }
    .version-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap; }
    .version-badge { background:#E6F1FB; color:#185FA5; font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; }
    .version-meta { font-size:12px; color:#888780; }
    .version-desc { font-size:13px; font-weight:500; }
    .version-just { font-size:12px; color:#888780; margin-top:2px; }
    .empty { text-align:center; padding:32px; color:#888780; }
  `],
})
export class HistoricoComponent implements OnInit {
  showForm = false
  versions: any[] = []
  users:    any[] = []
  form: any = { version: '', date: '', responsible_name: '', description: '', justification: '' }

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.select((state: any) => state.app?.versions ?? []).subscribe(v => this.versions = v)
    this.store.select((state: any) => state.app?.users ?? []).subscribe(u => this.users = u)
  }

  save() {
    if (!this.form.version || !this.form.description) return
    this.store.dispatch({
      type: '[Versions] Add',
      version: { ...this.form, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    } as any)
    this.showForm = false
    this.form = { version: '', date: '', responsible_name: '', description: '', justification: '' }
  }
}
