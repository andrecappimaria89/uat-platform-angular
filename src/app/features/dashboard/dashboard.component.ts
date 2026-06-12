import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { BaseChartDirective } from 'ng2-charts'
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController } from 'chart.js'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectDashboardMetrics } from '../../core/services/store.selectors'
import { STATUS_COLORS, SEVERITY_COLORS, PRIORITY_COLORS } from '../../core/models/constants'

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController)

@Component({
  selector:   'app-dashboard',
  standalone: true,
  imports:    [CommonModule, BaseChartDirective, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Dashboard Executivo"></app-topbar>

      <div class="content" *ngIf="metrics$ | async as m">

        <!-- Metric cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Total de Cenários</span>
            <span class="metric-value blue">{{ m.total }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Executados</span>
            <span class="metric-value green">{{ m.executed }}</span>
            <span class="metric-sub">{{ m.pctExec }}% do total</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Pendentes</span>
            <span class="metric-value gray">{{ m.todo }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Bloqueados</span>
            <span class="metric-value red">{{ m.bloqueado }}</span>
            <span class="metric-sub">{{ m.pctBlocked }}% do total</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Com Falha</span>
            <span class="metric-value red">{{ m.falha }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Sucesso</span>
            <span class="metric-value green">{{ m.sucesso }}</span>
            <span class="metric-sub">{{ m.pctSuccess }}% do total</span>
          </div>
        </div>

        <!-- Segmented progress bar -->
        <div class="card exec-bar-card">
          <p class="card-title">Progresso Geral de Execução</p>
          <div class="exec-bar">
            <div *ngIf="m.sucesso > 0"   [style.width.%]="pct(m.sucesso,m.total)"   style="background:#3B6D11" class="exec-seg">{{ pct(m.sucesso,m.total) }}% Sucesso</div>
            <div *ngIf="m.em_teste > 0"  [style.width.%]="pct(m.em_teste,m.total)"  style="background:#378ADD" class="exec-seg">{{ pct(m.em_teste,m.total) }}% Em Teste</div>
            <div *ngIf="m.bloqueado > 0" [style.width.%]="pct(m.bloqueado,m.total)" style="background:#A32D2D" class="exec-seg">{{ pct(m.bloqueado,m.total) }}% Bloqueado</div>
            <div *ngIf="m.todo > 0"      [style.width.%]="pct(m.todo,m.total)"      style="background:#888780" class="exec-seg">{{ pct(m.todo,m.total) }}% Pendente</div>
            <div *ngIf="m.total === 0"   style="width:100%;background:#D3D1C7" class="exec-seg gray-text">Nenhum cenário cadastrado</div>
          </div>
          <div class="bar-legend">
            <span><span class="dot" style="background:#3B6D11"></span>{{ pct(m.sucesso,m.total) }}% Sucesso ({{ m.sucesso }})</span>
            <span><span class="dot" style="background:#378ADD"></span>{{ pct(m.em_teste,m.total) }}% Em Teste ({{ m.em_teste }})</span>
            <span><span class="dot" style="background:#A32D2D"></span>{{ pct(m.bloqueado,m.total) }}% Bloqueado ({{ m.bloqueado }})</span>
            <span><span class="dot" style="background:#888780"></span>{{ pct(m.todo,m.total) }}% Pendente ({{ m.todo }})</span>
          </div>
        </div>

        <!-- Charts row 1 -->
        <div class="charts-row">
          <div class="card">
            <p class="card-title">Distribuição por Status</p>
            <div class="chart-wrap">
              <canvas baseChart
                [data]="getStatusChart(m)"
                type="doughnut"
                [options]="doughnutOpts">
              </canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">Cenários por Área</p>
            <div class="chart-wrap">
              <canvas baseChart
                [data]="getAreaChart(m)"
                type="bar"
                [options]="barOpts">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Charts row 2 -->
        <div class="charts-row three-col">
          <div class="card">
            <p class="card-title">Issues por Severidade</p>
            <div class="chart-wrap sm">
              <canvas baseChart
                [data]="getSevChart(m)"
                type="bar"
                [options]="barOpts">
              </canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">Issues por Prioridade</p>
            <div class="chart-wrap sm">
              <canvas baseChart
                [data]="getPriChart(m)"
                type="doughnut"
                [options]="doughnutOpts">
              </canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">KPIs</p>
            <div class="kpi-list">
              <div class="kpi-row"><span>% Sucesso</span><span class="kpi-val green">{{ m.pctSuccess }}%</span></div>
              <div class="kpi-row"><span>% Falha</span><span class="kpi-val red">{{ m.pctFail }}%</span></div>
              <div class="kpi-row"><span>% Executado</span><span class="kpi-val blue">{{ m.pctExec }}%</span></div>
              <div class="kpi-row"><span>% Bloqueado</span><span class="kpi-val red">{{ m.pctBlocked }}%</span></div>
              <div class="kpi-row"><span>Issues críticas</span><span class="kpi-val red">{{ m.issuesCritical }}</span></div>
              <div class="kpi-row"><span>Issues abertas</span><span class="kpi-val amber">{{ m.issuesOpen }}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page  { display:flex; flex-direction:column; flex:1; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .metrics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; }
    .metric-card { background:#f8f9fa; border-radius:10px; padding:14px; }
    .metric-label { display:block; font-size:12px; color:#888780; margin-bottom:4px; }
    .metric-value { display:block; font-size:26px; font-weight:500; }
    .metric-sub { display:block; font-size:11px; color:#888780; margin-top:2px; }
    .blue { color:#185FA5; } .green { color:#3B6D11; }
    .red  { color:#A32D2D; } .gray  { color:#888780; } .amber { color:#854F0B; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:16px; }
    .card-title { font-size:13px; font-weight:500; color:#888780; margin-bottom:12px; }
    .exec-bar { display:flex; height:28px; border-radius:8px; overflow:hidden; gap:1px; }
    .exec-seg { display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:500; color:white; min-width:0; overflow:hidden; }
    .gray-text { color:#888780; }
    .bar-legend { display:flex; flex-wrap:wrap; gap:12px; margin-top:8px; font-size:11px; color:#888780; }
    .bar-legend span { display:flex; align-items:center; gap:4px; }
    .dot { width:10px; height:10px; border-radius:2px; display:inline-block; }
    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .charts-row.three-col { grid-template-columns:1fr 1fr 1fr; }
    .chart-wrap { height:200px; }
    .chart-wrap.sm { height:160px; }
    .kpi-list { display:flex; flex-direction:column; gap:8px; }
    .kpi-row { display:flex; justify-content:space-between; font-size:13px; color:#888780; }
    .kpi-val { font-weight:500; }
    @media(max-width:768px) { .charts-row,.charts-row.three-col { grid-template-columns:1fr; } }
  `],
})
export class DashboardComponent {
  metrics$ = this.store.select(selectDashboardMetrics)

  doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const, labels: { boxWidth: 12, font: { size: 11 } } } },
  }
  barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } } },
  }

  constructor(private store: Store) {}

  pct(v: number, t: number): number {
    return t === 0 ? 0 : Math.round((v / t) * 100)
  }

  getStatusChart(m: any) {
    return {
      labels: ['Sucesso','Pendente','Em Teste','Bloqueado','Falha','Concluído'],
      datasets: [{ data: [m.sucesso,m.todo,m.em_teste,m.bloqueado,m.falha,m.concluido], backgroundColor: Object.values(STATUS_COLORS), borderWidth: 0 }],
    }
  }

  getAreaChart(m: any) {
    return {
      labels: m.byArea.map((a: any) => a.area),
      datasets: [
        { label: 'Total',   data: m.byArea.map((a: any) => a.total),   backgroundColor: '#B5D4F4', borderRadius: 4 },
        { label: 'Sucesso', data: m.byArea.map((a: any) => a.success), backgroundColor: '#3B6D11', borderRadius: 4 },
      ],
    }
  }

  getSevChart(m: any) {
    return {
      labels: Object.keys(m.issuesBySev),
      datasets: [{ label: 'Issues', data: Object.values(m.issuesBySev), backgroundColor: Object.values(SEVERITY_COLORS), borderRadius: 4 }],
    }
  }

  getPriChart(m: any) {
    return {
      labels: ['P1','P2','P3','P4'],
      datasets: [{ data: Object.values(m.issuesByPri), backgroundColor: Object.values(PRIORITY_COLORS), borderWidth: 0 }],
    }
  }
}
