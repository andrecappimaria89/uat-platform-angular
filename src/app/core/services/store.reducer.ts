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
  selectedPlanId: string
  loading:        boolean
  globalSearch:   string
  theme:          'light' | 'dark'
}

export const initialState: AppState = {
  scenarios:      [],
  issues:         [],
  areas:          [],
  users:          [],
  versions:       [],
  plans:          [],
  selectedPlanId: '',
  loading:        false,
  globalSearch:   '',
  theme:          'light',
}

export const appReducer = createReducer(
  initialState,

  // Bootstrap
  on(A.bootstrap,        (s) => ({ ...s, loading: true })),
  on(A.bootstrapSuccess, (s, { scenarios, issues, areas, users, versions, plans }) => ({
    ...s, scenarios, issues, areas, users, versions, plans,
    selectedPlanId: '', // ITEM 3/6: manter Todos os Projetos por padrão
    loading: false,
  })),
  on(A.bootstrapFailure, (s) => ({ ...s, loading: false })),

  // Plan — addPlan só entra no estado em addPlanSuccess (confirmado no Supabase)
  on(A.selectPlan,   (s, { id }) => ({ ...s, selectedPlanId: id })),
  on(A.addPlanSuccess, (s, { plan }) => ({ ...s, plans: [plan, ...s.plans] })),
  on(A.updatePlan,   (s, { plan }) => ({ ...s, plans: s.plans.map(p => p.id === plan.id ? plan : p) })),
  on(A.concludePlan, (s, { id }) => ({
    ...s,
    plans: s.plans.map(p => p.id === id
      ? { ...p, status: 'concluido' as const, concluded_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : p
    ),
  })),

  // Scenarios — addScenario só entra no estado em addScenarioSuccess
  on(A.addScenarioSuccess, (s, { scenario }) => ({ ...s, scenarios: [...s.scenarios, scenario] })),
  on(A.updateScenario, (s, { scenario }) => ({ ...s, scenarios: s.scenarios.map(x => x.id === scenario.id ? scenario : x) })),
  on(A.deleteScenario, (s, { id })       => ({ ...s, scenarios: s.scenarios.filter(x => x.id !== id) })),

  // Issues — addIssue só entra no estado em addIssueSuccess
  on(A.addIssueSuccess, (s, { issue }) => ({ ...s, issues: [issue, ...s.issues] })),
  on(A.updateIssue, (s, { issue }) => ({ ...s, issues: s.issues.map(x => x.id === issue.id ? issue : x) })),
  on(A.deleteIssue, (s, { id })    => ({ ...s, issues: s.issues.filter(x => x.id !== id) })),

  // Areas — addArea só entra no estado em addAreaSuccess
  on(A.addAreaSuccess, (s, { area }) => ({ ...s, areas: [...s.areas, area] })),
  on(A.updateArea, (s, { area }) => ({ ...s, areas: s.areas.map(x => x.id === area.id ? area : x) })),
  on(A.deleteArea, (s, { id })   => ({ ...s, areas: s.areas.filter(x => x.id !== id) })),

  // Users
  // addUser NÃO atualiza o estado aqui (seria otimista/sem confirmação).
  // O usuário só entra na lista em addUserSuccess, depois que a Netlify
  // Function confirma que ele foi criado de fato no Auth + profiles.
  on(A.addUserSuccess, (s, { user }) => ({ ...s, users: [...s.users, user] })),
  on(A.updateUser, (s, { user }) => ({ ...s, users: s.users.map(x => x.id === user.id ? user : x) })),
  on(A.deleteUser, (s, { id })   => ({ ...s, users: s.users.filter(x => x.id !== id) })),

  // Versions — addVersion só entra no estado em addVersionSuccess
  on(A.addVersionSuccess, (s, { version }) => ({ ...s, versions: [version, ...s.versions] })),

  // UI
  on(A.setGlobalSearch, (s, { query }) => ({ ...s, globalSearch: query })),
  on(A.setTheme,        (s, { theme }) => ({ ...s, theme })),
  on(A.setLoading,      (s, { loading }) => ({ ...s, loading })),
)
