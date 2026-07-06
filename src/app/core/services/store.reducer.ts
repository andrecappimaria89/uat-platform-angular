import { createReducer, on } from '@ngrx/store'
import type { Scenario, Issue, Area, User, Version, TestPlan } from '../models'
import * as A from './store.actions'

export interface AppState {
  scenarios:      Scenario[]
  issues:         Issue[]
  areas:          Area[]
  users:          User[]
  versions:       Version[]
  plans:          TestPlan[]
  selectedPlanId: string      // '' = Todos os Projetos (default)
  globalSearch:   string
  loading:        boolean
  error:          string | null
  theme:          'light' | 'dark'
}

export const initialState: AppState = {
  scenarios:      [],
  issues:         [],
  areas:          [],
  users:          [],
  versions:       [],
  plans:          [],
  selectedPlanId: '',   // ITEM 3/6: '' = Todos os Projetos por padrão
  globalSearch:   '',
  loading:        false,
  error:          null,
  theme:          'light',
}

export const appReducer = createReducer(
  initialState,

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  on(A.bootstrap, state => ({ ...state, loading: true, error: null })),
  on(A.bootstrapSuccess, (state, { scenarios, issues, areas, users, versions, plans }) => ({
    ...state, loading: false, scenarios, issues, areas, users, versions, plans,
  })),
  on(A.bootstrapFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // ── Plans ──────────────────────────────────────────────────────────────────
  on(A.addPlan, (state, { plan }) => ({ ...state, plans: [...state.plans, plan] })),
  on(A.updatePlan, (state, { plan }) => ({
    ...state, plans: state.plans.map(p => p.id === plan.id ? plan : p)
  })),
  on(A.concludePlan, (state, { id }) => ({
    ...state,
    plans: state.plans.map(p => p.id === id ? { ...p, status: 'concluido', concluded_at: new Date().toISOString() } : p),
    selectedPlanId: state.selectedPlanId === id ? '' : state.selectedPlanId,
  })),
  on(A.selectPlan, (state, { planId }) => ({ ...state, selectedPlanId: planId ?? '' })),

  // ── Scenarios ──────────────────────────────────────────────────────────────
  on(A.addScenario,    (state, { scenario }) => ({ ...state, scenarios: [...state.scenarios, scenario] })),
  on(A.updateScenario, (state, { scenario }) => ({ ...state, scenarios: state.scenarios.map(s => s.id === scenario.id ? scenario : s) })),
  on(A.deleteScenario, (state, { id })       => ({ ...state, scenarios: state.scenarios.filter(s => s.id !== id) })),

  // ── Issues ─────────────────────────────────────────────────────────────────
  on(A.addIssue,    (state, { issue }) => ({ ...state, issues: [...state.issues, issue] })),
  on(A.updateIssue, (state, { issue }) => ({ ...state, issues: state.issues.map(i => i.id === issue.id ? issue : i) })),
  on(A.deleteIssue, (state, { id })    => ({ ...state, issues: state.issues.filter(i => i.id !== id) })),

  // ── Areas ──────────────────────────────────────────────────────────────────
  on(A.addArea,    (state, { area }) => ({ ...state, areas: [...state.areas, area] })),
  on(A.updateArea, (state, { area }) => ({ ...state, areas: state.areas.map(a => a.id === area.id ? area : a) })),
  on(A.deleteArea, (state, { id })   => ({ ...state, areas: state.areas.filter(a => a.id !== id) })),

  // ── Users ──────────────────────────────────────────────────────────────────
  on(A.addUser,    (state, { user }) => ({ ...state, users: [...state.users, user] })),
  on(A.updateUser, (state, { user }) => ({ ...state, users: state.users.map(u => u.id === user.id ? user : u) })),
  on(A.deleteUser, (state, { id })   => ({ ...state, users: state.users.filter(u => u.id !== id) })),

  // ── Versions ───────────────────────────────────────────────────────────────
  on(A.addVersion, (state, { version }) => ({ ...state, versions: [...state.versions, version] })),

  // ── UI ─────────────────────────────────────────────────────────────────────
  on(A.setGlobalSearch, (state, { search }) => ({ ...state, globalSearch: search })),
  on(A.setTheme,        (state, { theme })  => ({ ...state, theme })),
)
