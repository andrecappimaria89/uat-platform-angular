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
    selectedPlanId: plans[0]?.id ?? '',
    loading: false,
  })),
  on(A.bootstrapFailure, (s) => ({ ...s, loading: false })),

  // Plan
  on(A.selectPlan,   (s, { id }) => ({ ...s, selectedPlanId: id })),
  on(A.addPlan,      (s, { plan }) => ({ ...s, plans: [plan, ...s.plans], selectedPlanId: plan.id })),
  on(A.updatePlan,   (s, { plan }) => ({ ...s, plans: s.plans.map(p => p.id === plan.id ? plan : p) })),
  on(A.concludePlan, (s, { id }) => ({
    ...s,
    plans: s.plans.map(p => p.id === id
      ? { ...p, status: 'concluido' as const, concluded_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : p
    ),
  })),

  // Scenarios
  on(A.addScenario,    (s, { scenario }) => ({ ...s, scenarios: [...s.scenarios, scenario] })),
  on(A.updateScenario, (s, { scenario }) => ({ ...s, scenarios: s.scenarios.map(x => x.id === scenario.id ? scenario : x) })),
  on(A.deleteScenario, (s, { id })       => ({ ...s, scenarios: s.scenarios.filter(x => x.id !== id) })),

  // Issues
  on(A.addIssue,    (s, { issue }) => ({ ...s, issues: [issue, ...s.issues] })),
  on(A.updateIssue, (s, { issue }) => ({ ...s, issues: s.issues.map(x => x.id === issue.id ? issue : x) })),
  on(A.deleteIssue, (s, { id })    => ({ ...s, issues: s.issues.filter(x => x.id !== id) })),

  // Areas
  on(A.addArea,    (s, { area }) => ({ ...s, areas: [...s.areas, area] })),
  on(A.updateArea, (s, { area }) => ({ ...s, areas: s.areas.map(x => x.id === area.id ? area : x) })),
  on(A.deleteArea, (s, { id })   => ({ ...s, areas: s.areas.filter(x => x.id !== id) })),

  // Users
  on(A.addUser,    (s, { user }) => ({ ...s, users: [...s.users, user] })),
  on(A.updateUser, (s, { user }) => ({ ...s, users: s.users.map(x => x.id === user.id ? user : x) })),
  on(A.deleteUser, (s, { id })   => ({ ...s, users: s.users.filter(x => x.id !== id) })),

  // Versions
  on(A.addVersion, (s, { version }) => ({ ...s, versions: [version, ...s.versions] })),

  // UI
  on(A.setGlobalSearch, (s, { query }) => ({ ...s, globalSearch: query })),
  on(A.setTheme,        (s, { theme }) => ({ ...s, theme })),
  on(A.setLoading,      (s, { loading }) => ({ ...s, loading })),
)
