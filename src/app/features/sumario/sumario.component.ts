import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { map } from 'rxjs/operators'
import { map } from 'rxjs/operators'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-sumario',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Sumário de Issues"></app-topbar>
      <div class="content">
        <div class="alert-box">
          <mat-icon>warning</mat-icon>
          <p><strong>Situação Atual:</strong> {{ critical$ | async }} issue(s) crítica(s) (S1/S2) abertas, {{ overdue$ | async }} com prazo vencido.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card red"><p class="stat-label">Issues S1/S2 Abertas</p><p class="stat-val">{{ critical$ | async }}</p></div>
          <div class="stat-card amber"><p class="stat-label">Prazo Vencido</p><p class="stat-val">{{ overdue$ | async }}</p></div>
          <div class="stat-card blue"><p class="stat-label">Total Abertas</p><p class="stat-val">{{ open$ | async }}</p></div>
          <div class="stat-card green"><p class="stat-label">Encerradas</p><p class="stat-val">{{ closed$ | async }}</p></div>
        </div>
      </div>
    </div>`,
  styles: [`.page{display:flex;flex-direction:column;flex:1;overflow-y:auto}.content{padding:24px;display:flex;flex-direction:column;gap:16px}.alert-box{display:flex;align-items:center;gap:8px;background:#FAEEDA;color:#854F0B;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.stat-card{background:white;border:0.5px solid rgba(0,0,0,.08);border-radius:12px;padding:16px;border-left:4px solid transparent}.stat-card.red{border-left-color:#E24B4A}.stat-card.amber{border-left-color:#EF9F27}.stat-card.blue{border-left-color:#185FA5}.stat-card.green{border-left-color:#3B6D11}.stat-label{font-size:12px;color:#888780}.stat-val{font-size:28px;font-weight:500;margin-top:4px}`],
})
export class SumarioComponent implements OnInit {
  _critical = 0; _overdue = 0; _open = 0; _closed = 0;critical$ = this.store.select(state => (state as any).app?.issues ?? []).pipe(map((i:any[]) => i.filter(x => (x.severity==='S1'||x.severity==='S2') && x.status!=='encerrado').length))
  overdue$ = this.store.select(state => (state as any).app?.issues ?? []).pipe(map((i:any[]) => i.filter(x => x.deadline && new Date(x.deadline+'T23:59:59')<new Date() && x.status!=='encerrado').length))
  open$     = this.store.select(state => (state as any).app?.issues ?? []).pipe(map((i:any[]) => i.filter(x => x.status!=='encerrado'&&x.status!=='cancelado').length))
  closed$   = this.store.select(state => (state as any).app?.issues ?? []).pipe(map((i:any[]) => i.filter(x => x.status==='encerrado').length))

  constructor(private store: Store) {}
  ngOnInit() {}
  
}
