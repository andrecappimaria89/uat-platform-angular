import { Component, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { BaseChartDirective } from 'ng2-charts'
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController } from 'chart.js'
import { distinctUntilChanged } from 'rxjs/operators'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectDashboardMetrics } from '../../core/services/store.selectors'
import { SEVERITY_COLORS, PRIORITY_COLORS } from '../../core/models/constants'

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController)

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartDirective, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Dashboard Executivo"></app-topbar>

      <div class="content" *ngIf="metrics$ | async as m">

        <!-- Metric cards — 5 status reais (sem Concluído) -->
        <div class="metrics-grid">
          <div class="metric-card blue-border">
            <span class="metric-label">Total de Cenários</span>
            <span class="metric-value blue">{{ m.total }}</span>
          </div>
          <div class="metric-card green-border">
            <span class="metric-label">Sucesso</span>
            <span class="metric-value green">{{ m.sucesso }}</span>
            <span class="metric-sub">{{ pct(m.sucesso, m.total) }}%</span>
          </div>
          <div class="metric-card blue-border">
            <span class="metric-label">Em Teste</span>
            <span class="metric-value blue">{{ m.em_teste }}</span>
            <span class="metric-sub">{{ pct(m.em_teste, m.total) }}%</span>
          </div>
          <div class="metric-card red-border">
            <span class="metric-label">Falha</span>
            <span class="metric-value red">{{ m.falha }}</span>
            <span class="metric-sub">{{ pct(m.falha, m.total) }}%</span>
          </div>
          <div class="metric-card red-border">
            <span class="metric-label">Bloqueados</span>
            <span class="metric-value red">{{ m.bloqueado }}</span>
            <span class="metric-sub">{{ pct(m.bloqueado, m.total) }}%</span>
          </div>
          <div class="metric-card gray-border">
            <span class="metric-label">Pendentes</span>
            <span class="metric-value gray">{{ m.todo }}</span>
            <span class="metric-sub">{{ pct(m.todo, m.total) }}%</span>
          </div>
          <div class="metric-card red-border">
            <span class="metric-label">Issues Críticas</span>
            <span class="metric-value red">{{ m.issuesCritical }}</span>
            <span class="metric-sub">S1/S2 abertas</span>
          </div>
        </div>

        <!-- Progress bar — 5 status (Concluído removido) -->
        <div class="card">
          <p class="card-title">Progresso Geral de Execução</p>
          <div class="exec-bar">
            <div *ngIf="m.sucesso>0"   [style.width.%]="pct(m.sucesso,m.total)"   style="background:#3B6D11" class="seg" [title]="'Sucesso: '+m.sucesso"><span *ngIf="pct(m.sucesso,m.total)>=7">{{pct(m.sucesso,m.total)}}%</span></div>
            <div *ngIf="m.em_teste>0"  [style.width.%]="pct(m.em_teste,m.total)"  style="background:#378ADD" class="seg" [title]="'Em Teste: '+m.em_teste"><span *ngIf="pct(m.em_teste,m.total)>=7">{{pct(m.em_teste,m.total)}}%</span></div>
            <div *ngIf="m.falha>0"     [style.width.%]="pct(m.falha,m.total)"     style="background:#791F1F" class="seg" [title]="'Falha: '+m.falha"><span *ngIf="pct(m.falha,m.total)>=7">{{pct(m.falha,m.total)}}%</span></div>
            <div *ngIf="m.bloqueado>0" [style.width.%]="pct(m.bloqueado,m.total)" style="background:#A32D2D" class="seg" [title]="'Bloqueado: '+m.bloqueado"><span *ngIf="pct(m.bloqueado,m.total)>=7">{{pct(m.bloqueado,m.total)}}%</span></div>
            <div *ngIf="m.todo>0"      [style.width.%]="pct(m.todo,m.total)"      style="background:#D3D1C7" class="seg" [title]="'Pendente: '+m.todo"><span *ngIf="pct(m.todo,m.total)>=7" style="color:#444">{{pct(m.todo,m.total)}}%</span></div>
            <div *ngIf="m.total===0" class="seg" style="width:100%;background:#E5E5E5"><span style="color:#888780">Nenhum cenário cadastrado</span></div>
          </div>
          <div class="bar-legend">
            <span><i style="background:#3B6D11"></i>Sucesso ({{m.sucesso}})</span>
            <span><i style="background:#378ADD"></i>Em Teste ({{m.em_teste}})</span>
            <span><i style="background:#791F1F"></i>Falha ({{m.falha}})</span>
            <span><i style="background:#A32D2D"></i>Bloqueado ({{m.bloqueado}})</span>
            <span><i style="background:#D3D1C7"></i>Pendente ({{m.todo}})</span>
          </div>
        </div>

        <!-- Charts row 1 -->
        <div class="charts-row">
          <div class="card">
            <p class="card-title">Distribuição por Status</p>
            <div class="chart-wrap">
              <canvas baseChart [data]="getStatusChart(m)" type="doughnut" [options]="doughnutOpts"></canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">Cenários por Área</p>
            <div class="chart-wrap">
              <canvas baseChart [data]="getAreaChart(m)" type="bar" [options]="barOpts"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts row 2 -->
        <div class="charts-row three-col">
          <div class="card">
            <p class="card-title">Issues por Severidade</p>
            <div class="chart-wrap sm">
              <canvas baseChart [data]="getSevChart(m)" type="bar" [options]="barOpts"></canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">Issues por Prioridade</p>
            <div class="chart-wrap sm">
              <canvas baseChart [data]="getPriChart(m)" type="doughnut" [options]="doughnutOpts"></canvas>
            </div>
          </div>
          <div class="card">
            <p class="card-title">KPIs</p>
            <div class="kpi-list">
              <div class="kpi-row"><span>% Sucesso</span><span class="kv green">{{pct(m.sucesso,m.total)}}%</span></div>
              <div class="kpi-row"><span>% Em Teste</span><span class="kv blue">{{pct(m.em_teste,m.total)}}%</span></div>
              <div class="kpi-row"><span>% Falha</span><span class="kv red">{{pct(m.falha,m.total)}}%</span></div>
              <div class="kpi-row"><span>% Bloqueado</span><span class="kv red">{{pct(m.bloqueado,m.total)}}%</span></div>
              <div class="kpi-row"><span>% Pendente</span><span class="kv gray">{{pct(m.todo,m.total)}}%</span></div>
              <div class="kpi-row sep"><span>Issues críticas</span><span class="kv red">{{m.issuesCritical}}</span></div>
              <div class="kpi-row"><span>Issues abertas</span><span class="kv amber">{{m.issuesOpen}}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; min-height:100%; }
    .content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .metrics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
    .metric-card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:10px; padding:14px; border-left:3px solid transparent; }
    .blue-border { border-left-color:#185FA5; } .green-border { border-left-color:#3B6D11; }
    .red-border  { border-left-color:#A32D2D; } .gray-border  { border-left-color:#888780; }
    .metric-label { display:block; font-size:12px; color:#888780; margin-bottom:4px; }
    .metric-value { display:block; font-size:24px; font-weight:500; }
    .metric-sub   { display:block; font-size:11px; color:#888780; margin-top:2px; }
    .blue { color:#185FA5; } .green { color:#3B6D11; } .red { color:#A32D2D; }
    .gray { color:#888780; } .amber { color:#854F0B; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:16px; }
    .card-title { font-size:13px; font-weight:500; color:#888780; margin-bottom:12px; }
    .exec-bar { display:flex; height:32px; border-radius:8px; overflow:hidden; gap:1px; background:#E5E5E5; }
    .seg { display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:white; min-width:0; overflow:hidden; }
    .bar-legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; font-size:12px; color:#444; }
    .bar-legend span { display:flex; align-items:center; gap:4px; }
    .bar-legend i { width:10px; height:10px; border-radius:2px; display:inline-block; flex-shrink:0; font-style:normal; }
    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .charts-row.three-col { grid-template-columns:1fr 1fr 1fr; }
    .chart-wrap { height:200px; } .chart-wrap.sm { height:160px; }
    .kpi-list { display:flex; flex-direction:column; gap:6px; }
    .kpi-row { display:flex; justify-content:space-between; font-size:13px; color:#888780; }
    .kpi-row.sep { border-top:0.5px solid rgba(0,0,0,.06); margin-top:4px; padding-top:8px; }
    .kv { font-weight:600; }
    @media(max-width:900px) { .charts-row,.charts-row.three-col { grid-template-columns:1fr; } }
  `],
})
export class DashboardComponent {
  metrics$ = this.store.select(selectDashboardMetrics).pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  )

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

  pct(v: number, t: number): number { return t === 0 ? 0 : Math.round((v / t) * 100) }

  getStatusChart(m: any) {
    return {
      labels: ['Sucesso','Em Teste','Falha','Bloqueado','Pendente'],
      datasets: [{ data: [m.sucesso,m.em_teste,m.falha,m.bloqueado,m.todo], backgroundColor: ['#3B6D11','#378ADD','#791F1F','#A32D2D','#D3D1C7'], borderWidth: 0 }],
    }
  }
  getAreaChart(m: any) {
    return {
      labels: m.byArea.map((a: any) => a.area),
      datasets: [
        { label:'Total',   data:m.byArea.map((a:any)=>a.total),   backgroundColor:'#B5D4F4', borderRadius:4 },
        { label:'Sucesso', data:m.byArea.map((a:any)=>a.success), backgroundColor:'#3B6D11', borderRadius:4 },
      ],
    }
  }
  getSevChart(m: any) {
    return { labels:Object.keys(m.issuesBySev), datasets:[{ label:'Issues', data:Object.values(m.issuesBySev), backgroundColor:Object.values(SEVERITY_COLORS), borderRadius:4 }] }
  }
  getPriChart(m: any) {
    return { labels:['P1','P2','P3','P4'], datasets:[{ data:Object.values(m.issuesByPri), backgroundColor:Object.values(PRIORITY_COLORS), borderWidth:0 }] }
  }
}
