import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-sumario',
  standalone: true,
  imports: [CommonModule, MatIconModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Sumário de Issues"></app-topbar>

      <div class="content">

        <!-- Alert -->
        <div class="alert-box">
          <mat-icon>warning</mat-icon>
          <p>
            <strong>Situação Atual:</strong>
            {{ critical }} issue(s) crítica(s) (S1/S2) abertas
            <ng-container *ngIf="overdue > 0">, {{ overdue }} com prazo vencido</ng-container>.
            <ng-container *ngIf="critical > 0"> Ação imediata requerida.</ng-container>
          </p>
        </div>

        <!-- KPI Cards -->
        <div class="stats-grid">
          <div class="stat-card red">
            <p class="stat-label">Issues S1/S2 Abertas</p>
            <p class="stat-val">{{ critical }}</p>
          </div>
          <div class="stat-card amber">
            <p class="stat-label">Prazo Vencido</p>
            <p class="stat-val">{{ overdue }}</p>
          </div>
          <div class="stat-card blue">
            <p class="stat-label">Total Abertas</p>
            <p class="stat-val">{{ open }}</p>
          </div>
          <div class="stat-card green">
            <p class="stat-label">Encerradas</p>
            <p class="stat-val">{{ closed }}</p>
          </div>
        </div>

        <!-- Tabela por severidade -->
        <div class="card">
          <h3 class="card-title"><mat-icon>table_chart</mat-icon> Issues por Severidade</h3>
          <table class="sev-table">
            <thead>
              <tr><th>Severidade</th><th>Abertas</th><th>Em Análise</th><th>Em Correção</th><th>Encerradas</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sevStats">
                <td><span class="badge" [style.background]="s.bg" [style.color]="s.color">{{ s.sev }}</span></td>
                <td class="num red-text">{{ s.aberto }}</td>
                <td class="num blue-text">{{ s.em_analise }}</td>
                <td class="num purple-text">{{ s.em_correcao }}</td>
                <td class="num green-text">{{ s.encerrado }}</td>
                <td class="num bold">{{ s.total }}</td>
              </tr>
              <tr *ngIf="sevStats.length === 0">
                <td colspan="6" class="empty">Nenhuma issue registrada.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .alert-box { display:flex; align-items:flex-start; gap:10px; background:#FAEEDA; color:#854F0B; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:500; }
    .alert-box mat-icon { margin-top:1px; flex-shrink:0; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }
    .stat-card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:16px; border-left:4px solid transparent; }
    .stat-card.red   { border-left-color:#E24B4A; }
    .stat-card.amber { border-left-color:#EF9F27; }
    .stat-card.blue  { border-left-color:#185FA5; }
    .stat-card.green { border-left-color:#3B6D11; }
    .stat-label { font-size:12px; color:#888780; margin-bottom:4px; }
    .stat-val { font-size:28px; font-weight:500; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:14px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .sev-table { width:100%; border-collapse:collapse; font-size:13px; }
    .sev-table th { text-align:left; padding:8px 12px; font-size:11px; font-weight:600; color:#888780; text-transform:uppercase; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); }
    .sev-table td { padding:8px 12px; border-bottom:0.5px solid rgba(0,0,0,.05); }
    .num { text-align:center; font-weight:500; }
    .red-text    { color:#A32D2D; }
    .blue-text   { color:#185FA5; }
    .purple-text { color:#5B21B6; }
    .green-text  { color:#3B6D11; }
    .bold        { font-weight:600; }
    .badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
    .empty { text-align:center; padding:24px; color:#888780; }
  `],
})
export class SumarioComponent implements OnInit {
  critical = 0
  overdue  = 0
  open     = 0
  closed   = 0
  sevStats: any[] = []

  private sevColors: Record<string, {bg:string;color:string}> = {
    S1: { bg: '#E24B4A', color: '#fff'    },
    S2: { bg: '#F09595', color: '#501313' },
    S3: { bg: '#EF9F27', color: '#412402' },
    S4: { bg: '#FAC775', color: '#633806' },
    S5: { bg: '#B5D4F4', color: '#0C447C' },
  }

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.select((state: any) => state.app?.issues ?? []).subscribe((issues: any[]) => {
      const now  = new Date()
      const open = issues.filter(i => i.status !== 'encerrado' && i.status !== 'cancelado')

      this.critical = open.filter(i => i.severity === 'S1' || i.severity === 'S2').length
      this.overdue  = open.filter(i => i.deadline && new Date(i.deadline + 'T23:59:59') < now).length
      this.open     = open.length
      this.closed   = issues.filter(i => i.status === 'encerrado').length

      this.sevStats = ['S1','S2','S3','S4','S5'].map(sev => {
        const sevIssues = issues.filter(i => i.severity === sev)
        if (sevIssues.length === 0) return null
        return {
          sev,
          bg:          this.sevColors[sev].bg,
          color:       this.sevColors[sev].color,
          aberto:      sevIssues.filter(i => i.status === 'aberto').length,
          em_analise:  sevIssues.filter(i => i.status === 'em_analise').length,
          em_correcao: sevIssues.filter(i => i.status === 'em_correcao').length,
          encerrado:   sevIssues.filter(i => i.status === 'encerrado').length,
          total:       sevIssues.length,
        }
      }).filter(Boolean)
    })
  }
}
