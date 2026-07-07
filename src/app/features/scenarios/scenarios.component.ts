import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core'
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
import { selectScenarios, selectAreas, selectUsers, selectIsProjectLocked, selectSelectedPlanId, selectGlobalSearch, selectPlans } from '../../core/services/store.selectors'
import { addScenario, updateScenario, deleteScenario } from '../../core/services/store.actions'
import { SCENARIO_STATUS_LABELS } from '../../core/models/constants'
import type { Scenario, TestPlan } from '../../core/models'

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatTooltipModule, TopbarComponent],
  template: `
    <div class="page">
      <app-topbar title="Cenários e Evidências">
        <button class="btn-outline" (click)="exportExcel()"><mat-icon>download</mat-icon> Exportar</button>
        <button class="btn-primary" *ngIf="!locked" (click)="openNew()"><mat-icon>add</mat-icon> Novo Cenário</button>
      </app-topbar>

      <div class="content">

        <!-- Filters -->
        <div class="filters-bar">
          <input [(ngModel)]="search" (ngModelChange)="applyAll()"
            placeholder="Buscar CT ID, cenário, funcionalidade..." class="input-filter">
          <select [(ngModel)]="filterArea" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todas as Áreas</option>
            <option *ngFor="let a of areas" [value]="a.name">{{ a.name }}</option>
          </select>
          <select [(ngModel)]="filterStatus" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todos os Status</option>
            <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
          </select>
          <select [(ngModel)]="filterResp" (ngModelChange)="applyAll()" class="select-filter">
            <option value="">Todos os Responsáveis</option>
            <option *ngFor="let u of users" [value]="u.name">{{ u.name }}</option>
          </select>
          <button class="btn-clear" (click)="clearFilters()"><mat-icon>clear</mat-icon> Limpar</button>
          <span class="count-badge">{{ filtered.length }} resultado(s)</span>
        </div>

        <!-- Form inline -->
        <div *ngIf="showForm" class="card form-card">
          <h3 class="card-title">
            <mat-icon>{{ editingScenario ? 'edit' : 'add_circle' }}</mat-icon>
            {{ editingScenario ? 'Editar Cenário — ' + editingScenario.ct_id : 'Novo Cenário de Teste' }}
          </h3>
          <div class="form-grid">
            <div class="form-field full">
              <label>Projeto * <span class="required-hint">(somente projetos abertos)</span></label>
              <select [(ngModel)]="form.project_id" class="select-required" [class.invalid]="formSubmitted && !form.project_id">
                <option value="">Selecione um projeto...</option>
                <option *ngFor="let p of openPlans" [value]="p.id">{{ p.project }}</option>
              </select>
              <span *ngIf="formSubmitted && !form.project_id" class="error-msg">Projeto é obrigatório</span>
            </div>
            <div class="form-field"><label>CT ID *</label><input [(ngModel)]="form.ct_id" placeholder="CT-001" [class.invalid]="formSubmitted && !form.ct_id"></div>
            <div class="form-field"><label>EF ID</label><input [(ngModel)]="form.ef_id" placeholder="EF-001"></div>
            <div class="form-field"><label>Funcionalidade</label><input [(ngModel)]="form.feature"></div>
            <div class="form-field">
              <label>Área *</label>
              <select [(ngModel)]="form.area_name" (ngModelChange)="onAreaChange($event)"
                class="select-required" [class.invalid]="formSubmitted && !form.area_name">
                <option value="">Selecione...</option>
                <option *ngFor="let a of areas" [value]="a.name">{{ a.name }}</option>
              </select>
              <span *ngIf="formSubmitted && !form.area_name" class="error-msg">Área é obrigatória</span>
            </div>
            <div class="form-field">
              <label>Responsável * <span class="required-hint" *ngIf="!form.area_name">(selecione a área primeiro)</span></label>
              <select [(ngModel)]="form.responsible_name" class="select-required"
                [class.invalid]="formSubmitted && !form.responsible_name" [disabled]="!form.area_name">
                <option value="">Selecione...</option>
                <option *ngFor="let u of usersByArea" [value]="u.name">{{ u.name }}</option>
              </select>
              <span *ngIf="formSubmitted && !form.responsible_name" class="error-msg">Responsável é obrigatório</span>
              <span *ngIf="form.area_name && usersByArea.length===0" class="info-msg">Nenhum usuário nesta área.</span>
            </div>
            <div class="form-field"><label>Data Planejada</label><input type="date" [(ngModel)]="form.planned_date"></div>
            <div class="form-field"><label>Status</label>
              <select [(ngModel)]="form.status">
                <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-field full"><label>Cenário *</label>
              <input [(ngModel)]="form.scenario" placeholder="Descrição do cenário de teste" [class.invalid]="formSubmitted && !form.scenario">
            </div>
            <div class="form-field full"><label>Pré-condições</label><textarea [(ngModel)]="form.preconditions" rows="2"></textarea></div>
            <div class="form-field full">
              <label>Passos Gherkin</label>
              <div class="gherkin-inputs">
                <div class="gherkin-row"><span class="keyword">Dado</span><input [(ngModel)]="form.gherkin!.dado" placeholder="o usuário está..."></div>
                <div class="gherkin-row"><span class="keyword">Quando</span><input [(ngModel)]="form.gherkin!.quando" placeholder="ele clica em..."></div>
                <div class="gherkin-row"><span class="keyword">Então</span><input [(ngModel)]="form.gherkin!.entao" placeholder="o sistema deve..."></div>
              </div>
            </div>
            <div class="form-field full"><label>Resultado Esperado</label><textarea [(ngModel)]="form.expected_result" rows="2"></textarea></div>
            <div class="form-field full"><label>Resultado Obtido</label><textarea [(ngModel)]="form.obtained_result" rows="2"></textarea></div>
            <div class="form-field full"><label>Comentários</label><textarea [(ngModel)]="form.comments" rows="2"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">
              <mat-icon>save</mat-icon> {{ editingScenario ? 'Salvar Alterações' : 'Criar Cenário' }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div *ngIf="paged.length === 0" class="empty-state">
            <mat-icon>science</mat-icon>
            <p>Nenhum cenário encontrado.</p>
          </div>
          <div class="table-scroll" *ngIf="paged.length > 0">
            <table>
              <thead>
                <tr>
                  <th [style.width.px]="colWidths[0]" class="th-resizable">CT ID<div class="rh" (mousedown)="startResize($event,0)"></div></th>
                  <th [style.width.px]="colWidths[1]" class="th-resizable">Projeto<div class="rh" (mousedown)="startResize($event,1)"></div></th>
                  <th [style.width.px]="colWidths[2]" class="th-resizable">Cenário<div class="rh" (mousedown)="startResize($event,2)"></div></th>
                  <th [style.width.px]="colWidths[3]" class="th-resizable">Dado / Quando / Então<div class="rh" (mousedown)="startResize($event,3)"></div></th>
                  <th [style.width.px]="colWidths[4]" class="th-resizable">Área<div class="rh" (mousedown)="startResize($event,4)"></div></th>
                  <th [style.width.px]="colWidths[5]" class="th-resizable">Responsável<div class="rh" (mousedown)="startResize($event,5)"></div></th>
                  <th [style.width.px]="colWidths[6]" class="th-resizable">Data Plan.<div class="rh" (mousedown)="startResize($event,6)"></div></th>
                  <th [style.width.px]="colWidths[7]" class="th-resizable">Status<div class="rh" (mousedown)="startResize($event,7)"></div></th>
                  <th style="width:80px">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of paged" [class.expanded]="expandedId === s.id">
                  <td class="ct-id" (click)="toggleExpand(s.id)">{{ s.ct_id }}</td>
                  <td class="proj-col">{{ getPlanName(s.project_id) }}</td>
                  <td class="scenario-col" (click)="toggleExpand(s.id)" [class.wrap]="expandedId === s.id">
                    <span>{{ s.scenario }}</span>
                    <button class="expand-btn">
                      <mat-icon>{{ expandedId === s.id ? 'unfold_less' : 'unfold_more' }}</mat-icon>
                    </button>
                  </td>
                  <td class="gherkin-col" [class.wrap]="expandedId === s.id">
                    <span class="g-line"><b>Dado</b> {{ s.gherkin?.dado || '—' }}</span>
                    <span class="g-line"><b>Quando</b> {{ s.gherkin?.quando || '—' }}</span>
                    <span class="g-line"><b>Então</b> {{ s.gherkin?.entao || '—' }}</span>
                  </td>
                  <td>{{ s.area_name }}</td>
                  <td>{{ s.responsible_name }}</td>
                  <td>{{ s.planned_date | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <!-- Badge de status — clique posiciona o dropdown via getBoundingClientRect -->
                    <button class="status-trigger" [class]="getBadgeClass(s.status)"
                      (click)="toggleStatusMenu(s, $event)"
                      matTooltip="Clique para alterar status">
                      {{ getStatusLabel(s.status) }}
                      <mat-icon class="caret">arrow_drop_down</mat-icon>
                    </button>
                  </td>
                  <td class="actions-col">
                    <button class="icon-btn" (click)="openEdit(s)" matTooltip="Editar" matTooltipPosition="above">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="icon-btn danger" *ngIf="!locked" (click)="remove(s)" matTooltip="Excluir" matTooltipPosition="above">
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

    <!-- Dropdown de status renderizado fora da tabela — evita ser cortado por overflow:hidden -->
    <div class="status-dropdown-global"
      *ngIf="openStatusMenuId"
      [style.top.px]="dropdownTop"
      [style.left.px]="dropdownLeft">
      <button *ngFor="let opt of statusOptions"
        class="status-option"
        [class.active]="opt.value === openStatusScenario?.status"
        (click)="quickChangeStatus(openStatusScenario!, opt.value)">
        <span class="badge" [class]="getBadgeClass(opt.value)">{{ opt.label }}</span>
        <mat-icon *ngIf="opt.value === openStatusScenario?.status"
          style="font-size:14px;width:14px;height:14px;color:#185FA5">check</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto; }
    .content { padding:24px; display:flex; flex-direction:column; gap:14px; }
    .proj-col { color:#888780; font-size:12px; }
    .ct-id { font-weight:600; color:#185FA5; cursor:pointer; }
    .scenario-col { position:relative; cursor:pointer; }
    .scenario-col:not(.wrap) { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .gherkin-col { font-size:11px; }
    .gherkin-col:not(.wrap) { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .gherkin-col.wrap { white-space:normal !important; }
    .g-line { display:block; color:#666; }
    .g-line b { color:#185FA5; font-weight:600; margin-right:3px; }
    td.wrap { white-space:normal !important; word-break:break-word; }
    .expand-btn { background:none; border:none; cursor:pointer; padding:0 2px; vertical-align:middle; opacity:.4; display:inline-flex; }
    .expand-btn:hover { opacity:1; }
    .expand-btn mat-icon { font-size:14px; width:14px; height:14px; }
    .gherkin-inputs { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
    .gherkin-row { display:flex; align-items:center; gap:8px; }
    .keyword { font-weight:600; color:#185FA5; font-size:13px; min-width:52px; }
    .gherkin-row input { flex:1; padding:7px 10px; border:0.5px solid rgba(0,0,0,.15); border-radius:8px; font-size:13px; }

    /* ── Status badge ── */
    .status-trigger { display:inline-flex; align-items:center; gap:2px; border:none; cursor:pointer; padding:2px 4px 2px 8px; border-radius:10px; font-size:11px; font-weight:600; transition:.1s; white-space:nowrap; }
    .status-trigger:hover { filter:brightness(.92); }
    .caret { font-size:14px !important; width:14px !important; height:14px !important; }

    /* ── Dropdown renderizado fora da tabela via position:fixed ── */
    .status-dropdown-global { position:fixed; background:white; border:0.5px solid rgba(0,0,0,.12); border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.15); z-index:99999; min-width:150px; padding:4px; }
    .status-option { display:flex; align-items:center; justify-content:space-between; gap:8px; width:100%; background:none; border:none; padding:7px 12px; border-radius:6px; cursor:pointer; transition:.1s; font-size:13px; }
    .status-option:hover { background:#f5f5f5; }
    .status-option.active { background:#EEF5FF; }
  `],
})
export class ScenariosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  search = ''; filterArea = ''; filterStatus = ''; filterResp = ''
  locked = false; formSubmitted = false
  expandedId: string | null = null
  openStatusMenuId: string | null = null
  openStatusScenario: Scenario | null = null
  dropdownTop = 0
  dropdownLeft = 0

  allScenarios: Scenario[] = []; filtered: Scenario[] = []; paged: Scenario[] = []
  areas: any[] = []; allUsers: any[] = []; usersByArea: any[] = []; openPlans: TestPlan[] = []
  planMap: Record<string, string> = {}
  pageSize = 20; currentPage = 1; totalPages = 1
  colWidths = [90, 110, 200, 220, 100, 130, 100, 140]
  private resizing: { index: number; startX: number; startW: number } | null = null
  showForm = false; editingScenario: Scenario | null = null; form: Partial<Scenario> = {}
  statusOptions = Object.entries(SCENARIO_STATUS_LABELS).map(([v,l]) => ({ value:v, label:l }))
  badgeMap: Record<string,string> = {
    todo:'badge-todo', em_teste:'badge-em-teste', bloqueado:'badge-bloqueado',
    falha:'badge-falha', sucesso:'badge-sucesso'
  }

  get users() { return this.allUsers }

  constructor(private store: Store, private snack: MatSnackBar) {}

  @HostListener('document:click')
  closeStatusMenu() {
    this.openStatusMenuId = null
    this.openStatusScenario = null
  }

  ngOnInit() {
    combineLatest([
      this.store.select(selectScenarios),
      this.store.select(selectSelectedPlanId),
      this.store.select(selectGlobalSearch),
      this.store.select(selectIsProjectLocked),
    ]).pipe(takeUntil(this.destroy$)).subscribe(([scenarios, planId, globalSearch, locked]) => {
      this.locked = locked
      this.allScenarios = planId
        ? scenarios.filter(s => !s.project_id || s.project_id === planId)
        : scenarios
      if (globalSearch) this.search = globalSearch
      this.applyAll()
    })
    this.store.select(selectAreas).pipe(takeUntil(this.destroy$)).subscribe(a => this.areas = a)
    this.store.select(selectUsers).pipe(takeUntil(this.destroy$)).subscribe(u => this.allUsers = u)
    this.store.select(selectPlans).pipe(takeUntil(this.destroy$)).subscribe(plans => {
      this.openPlans = plans.filter(p => p.status === 'aberto')
      this.planMap = {}
      plans.forEach(p => this.planMap[p.id] = p.project)
    })
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('mouseup',   this.onMouseUp.bind(this))
  }

  ngOnDestroy() {
    this.destroy$.next(); this.destroy$.complete()
    window.removeEventListener('mousemove', this.onMouseMove.bind(this))
    window.removeEventListener('mouseup',   this.onMouseUp.bind(this))
  }

  getPlanName(id?: string): string { return id ? (this.planMap[id] ?? '—') : '—' }
  toggleExpand(id: string) { this.expandedId = this.expandedId === id ? null : id }

  // Usa getBoundingClientRect para posicionar o dropdown com position:fixed
  // — não é afetado por overflow:hidden da tabela
  toggleStatusMenu(s: Scenario, event: MouseEvent) {
    event.stopPropagation()
    if (this.openStatusMenuId === s.id) {
      this.openStatusMenuId = null
      this.openStatusScenario = null
      return
    }
    const btn = event.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    this.dropdownTop  = rect.bottom + 6
    this.dropdownLeft = rect.left
    this.openStatusMenuId    = s.id
    this.openStatusScenario  = s
  }

  onAreaChange(areaName: string) {
    this.usersByArea = areaName ? this.allUsers.filter(u => u.area_name === areaName) : []
    if (this.form.responsible_name && !this.usersByArea.some(u => u.name === this.form.responsible_name)) {
      this.form.responsible_name = ''
    }
  }

  applyAll() {
    const q = this.search.toLowerCase().trim()
    this.filtered = this.allScenarios.filter(s => {
      if (this.filterArea   && s.area_name        !== this.filterArea)   return false
      if (this.filterStatus && s.status           !== this.filterStatus) return false
      if (this.filterResp   && s.responsible_name !== this.filterResp)   return false
      if (q && !s.ct_id?.toLowerCase().includes(q) &&
               !s.scenario?.toLowerCase().includes(q) &&
               !s.feature?.toLowerCase().includes(q)) return false
      return true
    })
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize))
    this.currentPage = 1; this.updatePage()
  }

  updatePage() { const s=(this.currentPage-1)*this.pageSize; this.paged=this.filtered.slice(s,s+this.pageSize) }
  goPage(p: number) { this.currentPage=Math.max(1,Math.min(p,this.totalPages)); this.updatePage() }
  clearFilters() { this.search=''; this.filterArea=''; this.filterStatus=''; this.filterResp=''; this.applyAll() }
  getStatusLabel(s: string) { return SCENARIO_STATUS_LABELS[s] ?? s }
  getBadgeClass(s: string)  { return this.badgeMap[s] ?? '' }

  quickChangeStatus(s: Scenario, newStatus: string) {
    this.openStatusMenuId   = null
    this.openStatusScenario = null
    if (s.status === newStatus) return
    this.store.dispatch(updateScenario({ scenario: { ...s, status: newStatus as any, updated_at: new Date().toISOString() } }))
    this.snack.open(`Status alterado para ${this.getStatusLabel(newStatus)}.`, 'OK', { duration: 2500 })
  }

  startResize(e: MouseEvent, i: number) { e.preventDefault(); this.resizing={index:i,startX:e.clientX,startW:this.colWidths[i]} }
  onMouseMove(e: MouseEvent) { if (!this.resizing) return; this.colWidths[this.resizing.index]=Math.max(60,this.resizing.startW+e.clientX-this.resizing.startX) }
  onMouseUp() { this.resizing=null }

  openNew() {
    this.editingScenario=null; this.formSubmitted=false; this.usersByArea=[]
    this.form = { ct_id:'', ef_id:'', scenario:'', feature:'', area_name:'', responsible_name:'', planned_date:'', status:'todo', preconditions:'', expected_result:'', obtained_result:'', comments:'', project_id:'', gherkin:{ dado:'', quando:'', entao:'' } }
    this.showForm=true
    setTimeout(()=>document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth'}),100)
  }

  openEdit(s: Scenario) {
    this.editingScenario=s; this.formSubmitted=false
    this.form={ ...s, gherkin:{ dado:s.gherkin?.dado??'', quando:s.gherkin?.quando??'', entao:s.gherkin?.entao??'' } }
    this.usersByArea = s.area_name ? this.allUsers.filter(u => u.area_name === s.area_name) : []
    this.showForm=true
    setTimeout(()=>document.querySelector('.form-card')?.scrollIntoView({behavior:'smooth'}),100)
  }

  closeForm() { this.showForm=false; this.editingScenario=null; this.form={}; this.formSubmitted=false; this.usersByArea=[] }

  save() {
    this.formSubmitted=true
    if (!this.form.project_id)       { this.snack.open('Selecione o Projeto.','OK',{duration:3000}); return }
    if (!this.form.area_name)        { this.snack.open('Selecione a Área.','OK',{duration:3000}); return }
    if (!this.form.responsible_name) { this.snack.open('Selecione o Responsável.','OK',{duration:3000}); return }
    if (!this.form.ct_id || !this.form.scenario) { this.snack.open('CT ID e Cenário são obrigatórios.','OK',{duration:3000}); return }
    const now=new Date().toISOString()
    if (this.editingScenario) {
      this.store.dispatch(updateScenario({ scenario:{ ...this.editingScenario,...this.form,updated_at:now } as Scenario }))
      this.snack.open('Cenário atualizado.','OK',{duration:3000})
    } else {
      this.store.dispatch(addScenario({ scenario:{ ...this.form,id:crypto.randomUUID(),created_at:now,updated_at:now } as Scenario }))
      this.snack.open('Salvando cenário...', undefined, { duration: 2000 })
    }
    this.closeForm()
  }

  remove(s: Scenario) {
    if (!confirm(`Excluir cenário ${s.ct_id}?`)) return
    this.store.dispatch(deleteScenario({ id:s.id }))
    this.snack.open('Cenário excluído.','OK',{duration:3000})
  }

  exportExcel() {
    const rows=this.filtered.map(s=>({
      'CT ID':s.ct_id,'EF ID':s.ef_id??'','Projeto':this.getPlanName(s.project_id),
      'Cenário':s.scenario,'Funcionalidade':s.feature??'','Área':s.area_name??'',
      'Responsável':s.responsible_name??'','Status':this.getStatusLabel(s.status),
      'Dado':s.gherkin?.dado??'','Quando':s.gherkin?.quando??'','Então':s.gherkin?.entao??''
    }))
    const ws=XLSX.utils.json_to_sheet(rows)
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Cenários')
    XLSX.writeFile(wb,'cenarios-uat.xlsx')
    this.snack.open('Excel exportado.','OK',{duration:3000})
  }
}
