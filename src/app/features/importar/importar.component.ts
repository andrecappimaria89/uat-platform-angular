import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { map } from 'rxjs/operators'
import * as XLSX from 'xlsx'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-importar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Importar Planilha" [showProjectSelector]="false"></app-topbar>
      <div class="content">
        <div class="drop-zone" (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          <p>Arraste o arquivo aqui ou clique para selecionar</p>
          <small>Formatos aceitos: .xlsx, .csv</small>
          <input #fileInput type="file" accept=".xlsx,.csv" (change)="onFile($event)" style="display:none">
        </div>
        <div class="card">
          <h3 class="card-title"><mat-icon>table_chart</mat-icon> Colunas Esperadas</h3>
          <div class="cols-grid">
            <span class="col-required" *ngFor="let c of requiredCols">{{ c }} *</span>
            <span class="col-optional" *ngFor="let c of optionalCols">{{ c }}</span>
          </div>
          <p class="info-note">* Obrigatórias.</p>
        </div>
        <div *ngIf="result" class="card">
          <h3 class="card-title"><mat-icon>summarize</mat-icon> Resultado</h3>
          <div class="result-grid">
            <div class="result-item green"><p>Importados</p><p class="result-val">{{ result.imported }}</p></div>
            <div class="result-item red"><p>Inválidos</p><p class="result-val">{{ result.invalid }}</p></div>
            <div class="result-item amber"><p>Duplicados</p><p class="result-val">{{ result.duplicates }}</p></div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`.page{display:flex;flex-direction:column;flex:1;overflow-y:auto}.content{padding:24px;display:flex;flex-direction:column;gap:16px}.drop-zone{border:2px dashed rgba(0,0,0,.15);border-radius:12px;padding:48px;text-align:center;cursor:pointer;color:#888780;transition:.15s}.drop-zone:hover{border-color:#185FA5;color:#185FA5;background:#F0F6FF}.drop-zone mat-icon{font-size:40px;width:40px;height:40px;display:block;margin:0 auto 12px}.drop-zone p{font-size:15px;font-weight:500;margin:4px 0}.drop-zone small{font-size:12px}.card{background:white;border:0.5px solid rgba(0,0,0,.08);border-radius:12px;padding:20px}.card-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:#185FA5;margin-bottom:12px}.cols-grid{display:flex;flex-wrap:wrap;gap:6px}.col-required{background:#E6F1FB;color:#185FA5;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:500}.col-optional{background:#f5f5f5;color:#888780;font-size:11px;padding:3px 8px;border-radius:6px}.info-note{font-size:11px;color:#888780;margin-top:8px}.result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.result-item{padding:12px;border-radius:8px;text-align:center;font-size:12px;color:#888780}.result-item.green{background:#EAF3DE}.result-item.red{background:#FCEBEB}.result-item.amber{background:#FAEEDA}.result-val{font-size:22px;font-weight:500;color:#1a1a1a}`],
})
export class ImportarComponent implements OnInit {
  result: any = null
  requiredCols = ['CT ID', 'Cenário', 'Status']
  optionalCols = ['EF ID', 'Funcionalidade', 'Área', 'Responsável', 'Data Planejada', 'Pré-condições', 'Dado', 'Quando', 'Então', 'Resultado Esperado', 'Comentários']

  constructor(private store: Store) {}
  ngOnInit() {}
  
  onFile(e: any) { const f = e.target.files[0]; if (f) this.processFile(f) }
  onDrop(e: any) { e.preventDefault(); const f = e.dataTransfer?.files[0]; if (f) this.processFile(f) }
  processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      const wb   = XLSX.read(e.target.result, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })
      let imported = 0, invalid = 0, duplicates = 0, errors: any[] = []
      rows.forEach((row: any, idx: number) => {
        const line = idx + 2
        if (!row['CT ID'] || !row['Cenário'] || !row['Status']) {
          errors.push({ row: line, field: 'Campos obrigatórios', message: 'CT ID, Cenário e Status são obrigatórios' })
          invalid++
        } else { imported++ }
      })
      this.result = { imported, invalid, duplicates, errors }
    }
    reader.readAsArrayBuffer(file)
  }
}
