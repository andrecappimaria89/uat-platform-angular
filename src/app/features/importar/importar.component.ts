import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { addScenario } from '../../core/services/store.actions'

declare const XLSX: any

@Component({
  selector: 'app-importar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Importar Planilha" [showProjectSelector]="false"></app-topbar>

      <div class="content">

        <!-- Drop zone -->
        <div class="drop-zone" (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          <p>Arraste o arquivo aqui ou clique para selecionar</p>
          <small>Formatos aceitos: .xlsx, .csv</small>
          <input #fileInput type="file" accept=".xlsx,.csv" (change)="onFile($event)" style="display:none">
        </div>

        <!-- Columns info -->
        <div class="card">
          <h3 class="card-title"><mat-icon>table_chart</mat-icon> Colunas Esperadas na Planilha</h3>
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
            <div class="result-item green">
              <p class="result-label">Importados</p>
              <p class="result-val">{{ result.imported }}</p>
            </div>
            <div class="result-item red">
              <p class="result-label">Inválidos</p>
              <p class="result-val">{{ result.invalid }}</p>
            </div>
            <div class="result-item amber">
              <p class="result-label">Duplicados</p>
              <p class="result-val">{{ result.duplicates }}</p>
            </div>
          </div>
          <div *ngIf="result.errors.length" class="errors-section">
            <h4>Erros encontrados</h4>
            <table class="errors-table">
              <thead><tr><th>Linha</th><th>Campo</th><th>Problema</th></tr></thead>
              <tbody>
                <tr *ngFor="let e of result.errors">
                  <td>{{ e.row }}</td>
                  <td>{{ e.field }}</td>
                  <td class="err-msg">{{ e.message }}</td>
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
    .result-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
    .result-item { padding:16px; border-radius:10px; text-align:center; }
    .result-item.green { background:#EAF3DE; }
    .result-item.red   { background:#FCEBEB; }
    .result-item.amber { background:#FAEEDA; }
    .result-label { font-size:12px; color:#888780; margin-bottom:4px; }
    .result-val { font-size:28px; font-weight:500; }
    .errors-section h4 { font-size:13px; color:#A32D2D; margin-bottom:8px; }
    .errors-table { width:100%; border-collapse:collapse; font-size:12px; }
    .errors-table th { text-align:left; padding:6px 10px; background:#f8f9fa; border-bottom:0.5px solid rgba(0,0,0,.08); font-weight:600; color:#888780; text-transform:uppercase; font-size:10px; }
    .errors-table td { padding:6px 10px; border-bottom:0.5px solid rgba(0,0,0,.05); }
    .err-msg { color:#A32D2D; }
  `],
})
export class ImportarComponent {
  result: any = null
  requiredCols = ['CT ID', 'Cenário', 'Status']
  optionalCols = ['EF ID', 'Funcionalidade', 'Área', 'Responsável', 'Data Planejada', 'Pré-condições', 'Dado', 'Quando', 'Então', 'Resultado Esperado', 'Comentários']

  private validStatuses = ['todo','em_teste','bloqueado','concluido','falha','sucesso','to do','em teste','bloqueado','concluído','falha','sucesso']

  constructor(private store: Store, private snack: MatSnackBar) {}

  onFile(e: any) {
    const file = e.target.files?.[0]
    if (file) this.processFile(file)
  }

  processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      try {
        const xlsxLib = (window as any).XLSX
        if (!xlsxLib) {
          this.snack.open('Processando arquivo...', '', { duration: 2000 })
          this.processCSVFallback(e.target.result, file.name)
          return
        }
        const wb   = xlsxLib.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = xlsxLib.utils.sheet_to_json(ws, { defval: '' }) as any[]
        this.processRows(rows)
      } catch (err) {
        this.snack.open('Erro ao processar arquivo.', 'OK', { duration: 3000 })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  private processCSVFallback(content: any, filename: string) {
    this.result = { imported: 0, invalid: 0, duplicates: 0, errors: [{ row: 1, field: 'Arquivo', message: 'Use a biblioteca xlsx para processar arquivos Excel.' }] }
  }

  private processRows(rows: any[]) {
    let imported = 0, invalid = 0, duplicates = 0
    const errors: any[] = []

    rows.forEach((row: any, idx: number) => {
      const line = idx + 2
      if (!row['CT ID'] || !row['Cenário'] || !row['Status']) {
        errors.push({ row: line, field: 'Obrigatórios', message: 'CT ID, Cenário e Status são obrigatórios' })
        invalid++
        return
      }
      const status = String(row['Status']).toLowerCase().replace(' ', '_')
      if (!this.validStatuses.includes(status)) {
        errors.push({ row: line, field: 'Status', message: `Status inválido: "${row['Status']}"` })
        invalid++
        return
      }
      this.store.dispatch(addScenario({ scenario: {
        id:               crypto.randomUUID(),
        ct_id:            String(row['CT ID']),
        ef_id:            row['EF ID'] || undefined,
        scenario:         String(row['Cenário']),
        feature:          row['Funcionalidade'] || '',
        area_name:        row['Área'] || undefined,
        responsible_name: row['Responsável'] || undefined,
        planned_date:     row['Data Planejada'] || undefined,
        preconditions:    row['Pré-condições'] || undefined,
        gherkin:          { dado: row['Dado'] || '', quando: row['Quando'] || '', entao: row['Então'] || '' },
        expected_result:  row['Resultado Esperado'] || undefined,
        status:           (status === 'to do' ? 'todo' : status.replace(' ','_')) as any,
        comments:         row['Comentários'] || undefined,
        created_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      }}))
      imported++
    })

    this.result = { imported, invalid, duplicates, errors }
    this.snack.open(`${imported} cenário(s) importado(s).`, 'OK', { duration: 4000 })
  }
}
