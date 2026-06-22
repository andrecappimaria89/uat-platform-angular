// ─── Auth & Users ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'gestor' | 'executor' | 'stakeholder'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  area_id?: string
  area_name?: string
  avatar_initials: string
  active: boolean
  created_at: string
}

// ─── Areas ────────────────────────────────────────────────────────────────────

export interface Area {
  id: string
  name: string
  responsible_id?: string
  responsible_name?: string
  members?: string[]
  created_at: string
}

// ─── Test Plan ────────────────────────────────────────────────────────────────

export type PlanStatus = 'aberto' | 'concluido'

export interface TestPlan {
  id: string
  project: string
  objective: string
  scope: string
  systems: string
  responsible_area: string
  stakeholders: string
  executors: string
  start_date: string
  end_date: string
  environments: string
  premises: string
  dependencies: string
  risks: string
  entry_criteria: string
  exit_criteria: string
  observations: string
  status: PlanStatus
  concluded_at?: string
  created_at: string
  updated_at: string
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export type ScenarioStatus =
  | 'todo' | 'em_teste' | 'bloqueado'
  | 'concluido' | 'falha' | 'sucesso'

export interface GherkinStep {
  dado: string
  quando: string
  entao: string
}

export interface Scenario {
  id: string
  ct_id: string
  ef_id?: string
  planned_date?: string
  responsible_id?: string
  responsible_name?: string
  area_id?: string
  area_name?: string
  scenario: string
  feature: string
  preconditions?: string
  gherkin: GherkinStep
  expected_result?: string
  expected_evidence?: string
  execution_date?: string
  effective_executor?: string
  obtained_result?: string
  realized_evidence?: string
  status: ScenarioStatus
  comments?: string
  project_id?: string
  created_at: string
  updated_at: string
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export type IssueSeverity = 'S1' | 'S2' | 'S3' | 'S4' | 'S5'
export type IssuePriority = 'P1' | 'P2' | 'P3' | 'P4'
export type IssueStatus   =
  | 'aberto' | 'em_analise' | 'em_correcao'
  | 'homologando' | 'encerrado' | 'cancelado'

export interface Issue {
  id: string
  issue_id: string
  title: string
  description: string
  scenario_id?: string
  scenario_ct?: string
  responsible_id?: string
  responsible_name?: string
  area_id?: string
  area_name?: string
  severity: IssueSeverity
  priority: IssuePriority
  status: IssueStatus
  opened_at: string
  deadline?: string
  closed_at?: string
  observations?: string
  evidences?: string
  comments?: string
  project_id?: string
  created_at: string
  updated_at: string
}

// ─── Versions ─────────────────────────────────────────────────────────────────

export interface Version {
  id: string
  version: string
  date: string
  responsible_id?: string
  responsible_name?: string
  description: string
  justification?: string
  plan_id?: string
  created_at: string
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ScenarioFilters {
  search:         string
  area_id:        string
  status:         string
  responsible_id: string
  feature:        string
  project_id:     string
}

export interface IssueFilters {
  search:         string
  severity:       string
  priority:       string
  status:         string
  area_id:        string
  responsible_id: string
  project_id:     string
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  imported:    number
  invalid:     number
  duplicates:  number
  date_errors: number
  errors:      { row: number; field: string; message: string }[]
}

export interface SelectOption {
  value: string
  label: string
}
