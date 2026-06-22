import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { map } from 'rxjs/operators'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Configurações" [showProjectSelector]="false"></app-topbar>
      <div class="content">
        <div class="cards-grid">
          <div class="card"><h3 class="card-title"><mat-icon>circle</mat-icon> Status de Cenário</h3>
            <div class="badges-list">
              <span class="badge todo">To Do</span><span class="badge em-teste">Em Teste</span>
              <span class="badge bloqueado">Bloqueado</span><span class="badge concluido">Concluído</span>
              <span class="badge falha">Falha</span><span class="badge sucesso">Sucesso</span>
            </div>
          </div>
          <div class="card"><h3 class="card-title"><mat-icon>priority_high</mat-icon> Severidade</h3>
            <div class="badges-list col">
              <span class="badge" style="background:#E24B4A;color:#fff">S1 – Bloqueio Total</span>
              <span class="badge" style="background:#F09595;color:#501313">S2 – Bloqueio Parcial</span>
              <span class="badge" style="background:#EF9F27;color:#412402">S3 – Bloqueio Cenário</span>
              <span class="badge" style="background:#FAC775;color:#633806">S4 – Não Bloqueante</span>
              <span class="badge" style="background:#B5D4F4;color:#0C447C">S5 – Estético</span>
            </div>
          </div>
          <div class="card"><h3 class="card-title"><mat-icon>low_priority</mat-icon> Prioridade</h3>
            <div class="badges-list col">
              <span class="badge" style="background:#E24B4A;color:#fff">P1 – Imediata</span>
              <span class="badge" style="background:#EF9F27;color:#412402">P2 – No Ciclo</span>
              <span class="badge" style="background:#FAC775;color:#633806">P3 – Pós Aceite</span>
              <span class="badge" style="background:#D3D1C7;color:#444441">P4 – Backlog</span>
            </div>
          </div>
          <div class="card"><h3 class="card-title"><mat-icon>storage</mat-icon> Banco de Dados</h3>
            <div class="db-info">
              <p>Backend: <strong>Supabase</strong></p>
              <p>Banco: <strong>PostgreSQL</strong></p>
              <p>RLS: <strong style="color:#3B6D11">Habilitado</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`.page{display:flex;flex-direction:column;flex:1;overflow-y:auto}.content{padding:24px}.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{background:white;border:0.5px solid rgba(0,0,0,.08);border-radius:12px;padding:20px}.card-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:#185FA5;margin-bottom:12px}.card-title mat-icon{font-size:18px;width:18px;height:18px}.badges-list{display:flex;flex-wrap:wrap;gap:6px}.badges-list.col{flex-direction:column}.badge{display:inline-flex;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:500}.todo{background:#D3D1C7;color:#444441}.em-teste{background:#B5D4F4;color:#0C447C}.bloqueado{background:#F7C1C1;color:#791F1F}.concluido{background:#C0DD97;color:#27500A}.falha{background:#F09595;color:#501313}.sucesso{background:#9FE1CB;color:#085041}.db-info{display:flex;flex-direction:column;gap:8px;font-size:13px;color:#888780}`],
})
export class ConfigComponent implements OnInit {
  

  constructor(private store: Store) {}
  ngOnInit() {}
  
}
