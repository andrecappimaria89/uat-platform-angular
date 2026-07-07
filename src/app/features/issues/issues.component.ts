import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { Subject, combineLatest } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import * as XLSX from 'xlsx'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'
import { selectIssues, selectAreas, selectUsers, selectScenarios, selectIsProjectLocked, selectSelectedPlanId, selectPlans } from '../../core/services/store.selectors'
import { addIssue, updateIssue, deleteIssue } from '../../core/services/store.actions'
import { SEVERITY_LABELS, PRIORITY_LABELS, ISSUE_STATUS_LABELS } from '../../core/models/constants'
import type { Issue, TestPlan, Scenario } from '../../core/models'

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatTooltipModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Controle de Issues">
        <button class="btn-outline" (click)="exportExcel()"><mat-icon>download</mat-icon> Exportar</button>
        <button class="btn-primary" *ngIf="!locked" (click)="openNew()"><mat-icon>add</mat-icon> Nova Issue</button>
      </app-topbar>

      <div class="content">

        <!-- Filters -->
        <div class="filters-bar">
          <input [(ngModel)]="search" (ngModelChange)="applyAll()" placeholder="Buscar ID, título..." class="input-filter">
          <select [(ngModel)]="filterSev" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todas as Severidades</option>
            <option *ngFor="let s of sevOptions" [value]="s.value">{{ s.label }}</option>
          </select>
          <select [(ngModel)]="filterPri" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todas as Prioridades</option>
            <option *ngFor="let p of priOptions" [value]="p.value">{{ p.label }}</option>
          </select>
          <select [(ngModel)]="filterStatus" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todos os Status</option>
            <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
          </select>
          <button class="btn-clear" (click)="clearFilters()">
            <mat-icon>clear</mat-icon> Limpar Filtros
          </button>
          <span class="count-badge">{{ filtered.length }} resultado(s)</span>
        </div>

        <!-- Form -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title">
            <mat-icon>{{ editingIssue ? 'edit' : 'bug_report' }}</mat-icon>
            {{ editingIssue ? 'Editar Issue — ' + editingIssue.issue_id : 'Nova Issue' }}
          </h3>
          <div class="form-grid">
            <!-- Projeto — obrigatório -->
            <div class="form-field full">
              <label>Projeto * <span class="required-hint">(obrigatório — somente projetos abertos)</span></label>
              <select [(ngModel)]="form.project_id" (ngModelChange)="onProjectChange($event)"
                class="select-required" [class.invalid]="formSubmitted && !form.project_id">
                <option value="">Selecione um projeto...</option>
                <option *ngFor="let p of openPlans" [value]="p.id">{{ p.project }}</option>
              </select>
              <span *ngIf="formSubmitted && !form.project_id" class="error-msg">Projeto é obrigatório</span>
            </div>
            <!-- Cenário — filtrado pelo projeto selecionado -->
            <div class="form-field">
              <label>Cenário Relacionado</label>
              <select [(ngModel)]="form.scenario_ct">
                <option value="">Selecione...</option>
                <option *ngFor="let s of filteredScenariosByProject" [value]="s.ct_id">
                  {{ s.ct_id }} — {{ s.scenario?.slice(0,40) }}
                </option>
              </select>
              <span *ngIf="form.project_id && filteredScenariosByProject.length === 0" class="info-msg">
                Nenhum cenário vinculado a este projeto.
              </span>
            </div>
            <div class="form-field"><label>ID da Issue *</label>
              <input [(ngModel)]="form.issue_id" placeholder="ISS-001" [class.invalid]="formSubmitted && !form.issue_id">
            </div>
            <div class="form-field full"><label>Título *</label>
              <input [(ngModel)]="form.title" [class.invalid]="formSubmitted && !form.title">
            </div>
            <div class="form-field full"><label>Descrição</label>
              <textarea [(ngModel)]="form.description" rows="3"></textarea>
            </div>
            <!-- ITEM 4: Área — ao selecionar, preenche Responsável automaticamente -->
            <div class="form-field"><label>Área</label>
              <select [(ngModel)]="form.area_name" (ngModelChange)="onAreaChange($event)">
                <option value="">Selecione...</option>
                <option *ngFor="let a of areas" [value]="a.name">{{ a.name }}</option>
              </select>
            </div>
            <!-- ITEM 4: Responsável — lista filtrada pelos usuários da área selecionada -->
            <div class="form-field">
              <label>
                Responsável
                <span *ngIf="form.area_name && areaUsers.length > 0" style="font-size:10px;color:#185FA5;font-weight:400">
                  (usuários da área)
                </span>
              </label>
              <select *ngIf="areaUsers.length > 0" [(ngModel)]="form.responsible_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of areaUsers" [value]="u.name">{{ u.name }}</option>
              </select>
              <input *ngIf="areaUsers.length === 0" [(ngModel)]="form.responsible_name"
                placeholder="Digite o nome do responsável">
            </div>
            <div class="form-field"><label>Severidade</label>
              <select [(ngModel)]="form.severity">
                <option *ngFor="let s of sevOptions" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Prioridade</label>
              <select [(ngModel)]="form.priority">
                <option *ngFor="let p of priOptions" [value]="p.value">{{ p.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Status</label>
              <select [(ngModel)]="form.status">
                <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-field"><label>Data de Abertura</label><input type="date" [(ngModel)]="form.opened_at"></div>
            <div class="form-field"><label>Prazo</label><input type="date" [(ngModel)]="form.deadline"></div>
            <div class="form-field full"><label>Observações</label><textarea [(ngModel)]="form.observations" rows="2"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">
              <mat-icon>save</mat-icon> {{ editingIssue ? 'Salvar' : 'Registrar Issue' }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div *ngIf="paged.length === 0" class="empty-state">
            <mat-icon>bug_report</mat-icon>
            <p>Nenhuma issue encontrada.</p>
          </div>
          <div class="table-scroll" *ngIf="paged.length > 0">
            <table>
              <thead>
                <tr>
                  <th *ngFor="let col of columns; let i = index" class="th-resizable" [style.width.px]="colWidths[i]">
                    {{ col }}<div class="rh" (mousedown)="startResize($event, i)"></div>
                  </th>
                  <th style="width:80px;text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:#888780;text-transform:uppercase;background:#f8f9fa;border-bottom:0.5px solid rgba(0,0,0,.08)">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let i of paged">
                  <td class="issue-id">{{ i.issue_id }}</td>
                  <td class="clip" [title]="i.title">{{ i.title }}</td>
                  <td class="proj-col">{{ getPlanName(i.project_id) }}</td>
                  <td class="ct-ref">{{ i.scenario_ct || '—' }}</td>
                  <td>{{ i.area_name }}</td>
                  <td><span class="badge" [class]="'sev-'+i.severity?.toLowerCase()">{{ i.severity }}</span></td>
                  <td><span class="badge" [class]="'pri-'+i.priority?.toLowerCase()">{{ i.priority }}</span></td>
                  <td><span class="badge" [class]="'ist-'+i.status">{{ getStatusLabel(i.status) }}</span></td>
                  <td [class.overdue]="isOverdue(i.deadline) && i.status!=='encerrado'">{{ i.deadline | date:'dd/MM/yyyy' }}</td>
                  <td>{{ i.responsible_name }}</td>
                  <td class="actions-col">
                    <button class="icon-btn" (click)="openEdit(i)" matTooltip="Editar" matTooltipPosition="above">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="icon-btn danger" *ngIf="!locked" (click)="remove(i)" matTooltip="Excluir" matTooltipPosition="above">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages > 1">
            <button class="icon-btn" [disabled]="currentPage===1" (click)="goPage(1)"><mat-icon>first_page</mat-icon></button>
            <button class="icon-btn" [disabled]="currentPage===1" (click)="goPage(currentPage-1)"><mat-icon>chevron_left</mat-icon></button>
            <span class="page-info">Página {{ currentPage }} de {{ totalPages }} ({{ filtered.length }} itens)</span>
            <button class="icon-btn" [disabled]="currentPage===totalPages" (click)="goPage(currentPage+1)"><mat-icon>chevron_right</mat-icon></button>
            <button class="icon-btn" [disabled]="currentPage===totalPages" (click)="goPage(totalPages)"><mat-icon>last_page</mat-icon></button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; min-height:100%; }
    .content { padding:24px; display:flex; flex-direction:column; gap:14px; }
    .issue-id { font-weight:600; color:#A32D2D; }
    .proj-col { color:#888780; font-size:12px; }
    .ct-ref { color:#185FA5; font-weight:500; }
    .clip { max-width:180px; }
    .overdue { color:#A32D2D; font-weight:500; }
  `],
})
export class IssuesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  search=''; filterSev=''; filterPri=''; filterStatus=''; locked=false; formSubmitted=false
  allIssues:Issue[]=[]; filtered:Issue[]=[]; paged:Issue[]=[]; areas:any[]=[]; users:any[]=[]; allScenarios:Scenario[]=[]; openPlans:TestPlan[]=[]
  areaUsers: any[] = []  // ITEM 4: usuários da área selecionada no form
  filteredScenariosByProject: Scenario[] = []
  planMap: Record<string,string> = {}
  pageSize=20; currentPage=1; totalPages=1
  columns=['ID','Título','Projeto','Cenário','Área','Severidade','Prioridade','Status','Prazo','Responsável']
  colWidths=[90,180,120,90,100,90,80,100,100,120]
  private resizing:{index:number;startX:number;startW:number}|null=null
  showForm=false; editingIssue:Issue|null=null; form:Partial<Issue>={}
  sevOptions=Object.entries(SEVERITY_LABELS).map(([v,l])=>({value:v,label:l}))
  priOptions=Object.entries(PRIORITY_LABELS).map(([v,l])=>({value:v,label:l}))
  statusOptions=Object.entries(ISSUE_STATUS_LABELS).map(([v,l])=>({value:v,label:l}))

  constructor(private store:Store, private snack:MatSnackBar) {}

  ngOnInit() {
    combineLatest([this.store.select(selectIssues), this.store.select(selectSelectedPlanId), this.store.select(selectIsProjectLocked)])
      .pipe(takeUntil(this.destroy$)).subscribe(([issues,planId,locked])=>{
        this.locked=locked
        this.allIssues=planId?issues.filter(i=>!i.project_id||i.project_id===planId):issues
        this.applyAll()
      })
    this.store.select(selectAreas).pipe(takeUntil(this.destroy$)).subscribe(a=>this.areas=a)
    this.store.select(selectUsers).pipe(takeUntil(this.destroy$)).subscribe(u=>this.users=u)
    this.store.select(selectScenarios).pipe(takeUntil(this.destroy$)).subscribe(s=>this.allScenarios=s)
    this.store.select(selectPlans).pipe(takeUntil(this.destroy$)).subscribe(plans=>{
      this.openPlans=plans.filter(p=>p.status==='aberto')
      this.planMap={}; plans.forEach(p=>this.planMap[p.id]=p.project)
    })
    window.addEventListener('mousemove',this.onMouseMove.bind(this))
    window.addEventListener('mouseup',this.onMouseUp.bind(this))
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); window.removeEventListener('mousemove',this.onMouseMove.bind(this)); window.removeEventListener('mouseup',this.onMouseUp.bind(this)) }

  getPlanName(id?:string):string { return id?(this.planMap[id]??'—'):'—' }

  onProjectChange(projectId:string) {
    this.form.project_id=projectId
    this.form.scenario_ct=''
    this.filteredScenariosByProject=projectId?this.allScenarios.filter(s=>s.project_id===projectId):[]
  }

  // ITEM 4: Ao selecionar área, filtra usuários e preenche responsável automaticamente
  onAreaChange(areaName: string) {
    const area = this.areas.find((a:any) => a.name === areaName) as any
    const members: string[] = area?.members ?? []
    this.areaUsers = this.users.filter(u => members.includes(u.name))
    if (this.areaUsers.length === 1) {
      this.form.responsible_name = this.areaUsers[0].name
    } else if (this.areaUsers.length > 1) {
      const resp = area?.responsible_name
      this.form.responsible_name = resp && this.areaUsers.some((u:any) => u.name === resp) ? resp : ''
    } else {
      this.form.responsible_name = ''
    }
  }

  applyAll() {
    const q=this.search.toLowerCase().trim()
    this.filtered=this.allIssues.filter(i=>{
      if(this.filterSev&&i.severity!==this.filterSev)return false
      if(this.filterPri&&i.priority!==this.filterPri)return false
      if(this.filterStatus&&i.status!==this.filterStatus)return false
      if(q&&!i.issue_id?.toLowerCase().includes(q)&&!i.title?.toLowerCase().includes(q))return false
      return true
    })
    this.totalPages=Math.max(1,Math.ceil(this.filtered.length/this.pageSize)); this.currentPage=1; this.updatePage()
  }

  updatePage(){const s=(this.currentPage-1)*this.pageSize;this.paged=this.filtered.slice(s,s+this.pageSize)}
  goPage(p:number){this.currentPage=Math.max(1,Math.min(p,this.totalPages));this.updatePage()}
  clearFilters(){this.search='';this.filterSev='';this.filterPri='';this.filterStatus='';this.applyAll()}
  getStatusLabel(s:string){return ISSUE_STATUS_LABELS[s]??s}
  isOverdue(d?:string){return d?new Date(d+'T23:59:59')<new Date():false}
  startResize(e:MouseEvent,i:number){e.preventDefault();this.resizing={index:i,startX:e.clientX,startW:this.colWidths[i]}}
  onMouseMove(e:MouseEvent){if(!this.resizing)return;this.colWidths[this.resizing.index]=Math.max(60,this.resizing.startW+e.clientX-this.resizing.startX)}
  onMouseUp(){this.resizing=null}

  openNew() {
    this.editingIssue=null; this.formSubmitted=false; this.filteredScenariosByProject=[]
    this.form={issue_id:'',title:'',description:'',scenario_ct:'',area_name:'',responsible_name:'',severity:'S3',priority:'P2',status:'aberto',opened_at:new Date().toISOString().slice(0,10),observations:'',project_id:''}
    this.showForm=true
    setTimeout(()=>document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth'}),100)
  }

  openEdit(i:Issue) {
    this.editingIssue=i; this.formSubmitted=false
    this.form={...i}
    this.filteredScenariosByProject=i.project_id?this.allScenarios.filter(s=>s.project_id===i.project_id):[]
    this.showForm=true
    setTimeout(()=>document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth'}),100)
  }

  closeForm(){this.showForm=false;this.editingIssue=null;this.form={};this.formSubmitted=false;this.filteredScenariosByProject=[];this.areaUsers=[]}

  save() {
    this.formSubmitted=true
    if(!this.form.project_id){this.snack.open('Selecione o Projeto (obrigatório).','OK',{duration:3000});return}
    if(!this.form.issue_id||!this.form.title){this.snack.open('ID e Título são obrigatórios.','OK',{duration:3000});return}
    const now=new Date().toISOString()
    if(this.editingIssue){
      this.store.dispatch(updateIssue({issue:{...this.editingIssue,...this.form,updated_at:now} as Issue}))
      this.snack.open('Issue atualizada.','OK',{duration:3000})
    } else {
      this.store.dispatch(addIssue({issue:{...this.form,id:crypto.randomUUID(),created_at:now,updated_at:now} as Issue}))
      this.snack.open('Salvando issue...', undefined, {duration:2000})
    }
    this.closeForm()
  }

  remove(i:Issue) {
    if(!confirm(`Excluir issue ${i.issue_id}?`))return
    this.store.dispatch(deleteIssue({id:i.id}))
    this.snack.open('Issue excluída.','OK',{duration:3000})
  }

  exportExcel() {
    const rows=this.filtered.map(i=>({'ID':i.issue_id,'Título':i.title,'Projeto':this.getPlanName(i.project_id),'Cenário':i.scenario_ct,'Área':i.area_name,'Severidade':i.severity,'Prioridade':i.priority,'Status':this.getStatusLabel(i.status),'Prazo':i.deadline,'Responsável':i.responsible_name}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Issues');XLSX.writeFile(wb,'issues-uat.xlsx')
    this.snack.open('Excel exportado.','OK',{duration:3000})
  }
}
