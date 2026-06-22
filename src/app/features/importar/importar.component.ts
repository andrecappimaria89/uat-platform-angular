import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { addScenario } from '../../core/services/store.actions'
import * as XLSX from 'xlsx'

@Component({
  selector: 'app-importar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Importar Planilha" [showProjectSelector]="false"></app-topbar>
      <div class="content">

        <!-- Actions -->
        <div class="actions-row">
          <button class="btn-primary" (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon> Importar Planilha
            <input #fileInput type="file" accept=".xlsx,.csv" (change)="onFile($event)" style="display:none">
          </button>
          <button class="btn-outline" (click)="downloadExample()">
            <mat-icon>download</mat-icon> Baixar Planilha Exemplo
          </button>
        </div>

        <!-- Drop zone -->
        <div class="drop-zone" (click)="fileInput2.click()"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop($event)">
          <mat-icon>cloud_upload</mat-icon>
          <p>Arraste o arquivo aqui ou clique para selecionar</p>
          <small>Formatos aceitos: .xlsx, .csv</small>
          <input #fileInput2 type="file" accept=".xlsx,.csv" (change)="onFile($event)" style="display:none">
        </div>

        <!-- Columns info -->
        <div class="card">
          <h3 class="card-title"><mat-icon>table_chart</mat-icon> Colunas da Planilha</h3>
          <div class="cols-grid">
            <span class="col-required" *ngFor="let c of requiredCols">{{ c }} *</span>
            <span class="col-optional" *ngFor="let c of optionalCols">{{ c }}</span>
          </div>
          <p class="info-note">* Obrigatórias. Status aceitos: To Do, Em Teste, Bloqueado, Concluído, Falha, Sucesso</p>
        </div>

        <!-- Result -->
        <div *ngIf="result" class="card">
          <h3 class="card-title"><mat-icon>summarize</mat-icon> Resultado da Importação</h3>
          <div class="result-grid">
            <div class="result-item green"><p class="rl">Importados</p><p class="rv">{{ result.imported }}</p></div>
            <div class="result-item red"><p class="rl">Inválidos</p><p class="rv">{{ result.invalid }}</p></div>
            <div class="result-item amber"><p class="rl">Duplicados</p><p class="rv">{{ result.duplicates }}</p></div>
          </div>
          <div *ngIf="result.errors.length" style="margin-top:12px">
            <p style="font-size:13px;font-weight:500;color:#A32D2D;margin-bottom:8px">Erros encontrados</p>
            <table class="err-table">
              <thead><tr><th>Linha</th><th>Campo</th><th>Problema</th></tr></thead>
              <tbody>
                <tr *ngFor="let e of result.errors">
                  <td>{{ e.row }}</td><td>{{ e.field }}</td><td style="color:#A32D2D">{{ e.message }}</td>
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
    .actions-row { display:flex; gap:12px; flex-wrap:wrap; }
    .drop-zone { border:2px dashed rgba(0,0,0,.15); border-radius:12px; padding:48px 24px; text-align:center; cursor:pointer; color:#888780; transition:.15s; }
    .drop-zone:hover { border-color:#185FA5; color:#185FA5; background:#F0F6FF; }
    .drop-zone mat-icon { font-size:48px; width:48px; height:48px; display:block; margin:0 auto 12px; }
    .drop-zone p { font-size:15px; font-weight:500; margin:4px 0; }
    .drop-zone small { font-size:12px; }
    .card { background:white; border:0.5px solid rgba(0,0,0,.08); border-radius:12px; padding:20px; }
    .card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#185FA5; margin-bottom:12px; }
    .card-title mat-icon { font-size:18px; width:18px; height:18px; }
    .cols-grid { display:flex; flex-wrap:wrap; gap:6px; }
    .col-required { background:#E6F1FB; color:#185FA5; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600; }
    .col-optional { background:#f5f5f5; color:#888780; font-size:11px; padding:3px 8px; border-radius:6px; }
    .info-note { font-size:11px; color:#888780; margin-top:8px; }
    .result-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .result-item { padding:14px; border-radius:10px; text-align:center; }
    .result-item.green { background:#EAF3DE; } .result-item.red { background:#FCEBEB; } .result-item.amber { background:#FAEEDA; }
    .rl { font-size:12px; color:#888780; } .rv { font-size:26px; font-weight:500; }
    .err-table { width:100%; border-collapse:collapse; font-size:12px; }
    .err-table th { text-align:left; padding:6px 10px; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); font-size:10px; font-weight:600; color:#888780; text-transform:uppercase; }
    .err-table td { padding:6px 10px; border-bottom:0.5px solid rgba(0,0,0,.05); }
  `],
})
export class ImportarComponent {
  result: any = null
  requiredCols = ['CT ID', 'Cenário', 'Status']
  optionalCols = ['EF ID', 'Funcionalidade', 'Área', 'Responsável', 'Data Planejada', 'Pré-condições', 'Dado', 'Quando', 'Então', 'Resultado Esperado', 'Comentários']

  private statusMap: Record<string,string> = {
    'to do':'todo','em teste':'em_teste','bloqueado':'bloqueado',
    'concluído':'concluido','concluido':'concluido','falha':'falha','sucesso':'sucesso',
  }

  constructor(private store: Store, private snack: MatSnackBar) {}

  onFile(e: any)   { const f = e.target.files?.[0]; if (f) this.processFile(f) }
  onDrop(e: any)   { e.preventDefault(); const f = e.dataTransfer?.files[0]; if (f) this.processFile(f) }

  processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      try {
        const wb   = XLSX.read(e.target.result, { type:'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval:'' })
        this.processRows(rows)
      } catch {
        this.snack.open('Erro ao processar o arquivo.', 'OK', { duration:3000 })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  processRows(rows: any[]) {
    let imported = 0, invalid = 0, duplicates = 0
    const errors: any[] = []
    const ids = new Set<string>()

    rows.forEach((row: any, idx: number) => {
      const line = idx + 2
      const ctId = String(row['CT ID'] ?? '').trim()

      if (!ctId || !row['Cenário'] || !row['Status']) {
        errors.push({ row:line, field:'Obrigatórios', message:'CT ID, Cenário e Status são obrigatórios' }); invalid++; return
      }
      if (ids.has(ctId)) {
        errors.push({ row:line, field:'CT ID', message:`ID duplicado: "${ctId}"` }); duplicates++; return
      }

      const statusRaw = String(row['Status']).toLowerCase().trim()
      const status    = this.statusMap[statusRaw] ?? statusRaw
      const validSts  = ['todo','em_teste','bloqueado','concluido','falha','sucesso']
      if (!validSts.includes(status)) {
        errors.push({ row:line, field:'Status', message:`Status inválido: "${row['Status']}"` }); invalid++; return
      }

      ids.add(ctId)
      this.store.dispatch(addScenario({ scenario: {
        id:               crypto.randomUUID(),
        ct_id:            ctId,
        ef_id:            row['EF ID'] || undefined,
        scenario:         String(row['Cenário']),
        feature:          row['Funcionalidade'] || '',
        area_name:        row['Área'] || undefined,
        responsible_name: row['Responsável'] || undefined,
        planned_date:     row['Data Planejada'] || undefined,
        preconditions:    row['Pré-condições'] || undefined,
        gherkin:          { dado:row['Dado']||'', quando:row['Quando']||'', entao:row['Então']||'' },
        expected_result:  row['Resultado Esperado'] || undefined,
        status:           status as any,
        comments:         row['Comentários'] || undefined,
        created_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      }}))
      imported++
    })

    this.result = { imported, invalid, duplicates, errors }
    this.snack.open(`${imported} cenário(s) importado(s).`, 'OK', { duration:4000 })
  }

  downloadExample() {
    const example = [
      { 'CT ID':'CT-001', 'EF ID':'EF-001', 'Cenário':'Login com credenciais válidas', 'Funcionalidade':'Autenticação', 'Área':'TI', 'Responsável':'João Silva', 'Data Planejada':'01/06/2025', 'Pré-condições':'Usuário cadastrado no sistema', 'Dado':'o usuário está na tela de login', 'Quando':'ele informa credenciais válidas', 'Então':'o sistema redireciona ao dashboard', 'Resultado Esperado':'Acesso concedido', 'Status':'To Do', 'Comentários':'' },
      { 'CT ID':'CT-002', 'EF ID':'EF-002', 'Cenário':'Aprovação de nota fiscal', 'Funcionalidade':'Fiscal/NF-e', 'Área':'Financeiro', 'Responsável':'Maria Costa', 'Data Planejada':'02/06/2025', 'Pré-condições':'NF-e pendente no portal', 'Dado':'a NF-e está no portal de aprovações', 'Quando':'o aprovador clica em Aprovar', 'Então':'o sistema registra a aprovação no ERP', 'Resultado Esperado':'NF-e aprovada', 'Status':'Em Teste', 'Comentários':'Verificar integração' },
      { 'CT ID':'CT-003', 'EF ID':'EF-003', 'Cenário':'Emissão de pedido de compra', 'Funcionalidade':'Procurement', 'Área':'Logística', 'Responsável':'Ana Costa', 'Data Planejada':'03/06/2025', 'Pré-condições':'Fornecedor cadastrado', 'Dado':'o usuário está no módulo de compras', 'Quando':'ele preenche e emite o pedido', 'Então':'o sistema gera o PC e notifica', 'Resultado Esperado':'PC emitido com sucesso', 'Status':'Sucesso', 'Comentários':'' },
    ]
    const ws = XLSX.utils.json_to_sheet(example)
    // Style header row width
    ws['!cols'] = [
      {wch:8},{wch:8},{wch:35},{wch:20},{wch:12},{wch:16},{wch:14},
      {wch:25},{wch:30},{wch:30},{wch:30},{wch:25},{wch:10},{wch:20},
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cenários Exemplo')
    XLSX.writeFile(wb, 'planilha-exemplo-uat.xlsx')
    this.snack.open('Planilha exemplo baixada!', 'OK', { duration:3000 })
  }
}
