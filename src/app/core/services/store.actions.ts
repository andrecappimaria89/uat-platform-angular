import { createAction, props } from '@ngrx/store'
import type { Scenario, Issue, Area, User, Version, TestPlan } from '../models'

// ─── Bootstrap ───────────────────────────────────────────────────────────────
export const bootstrap        = createAction('[App] Bootstrap')
export const bootstrapSuccess = createAction('[App] Bootstrap Success', props<{
  scenarios: Scenario[]; issues: Issue[]; areas: Area[]
  users: User[]; versions: Version[]; plans: TestPlan[]
}>())
export const bootstrapFailure = createAction('[App] Bootstrap Failure', props<{ error: string }>())

// ─── Plan ─────────────────────────────────────────────────────────────────────
export const selectPlan      = createAction('[Plan] Select',       props<{ id: string }>())
export const addPlan         = createAction('[Plan] Add',          props<{ plan: TestPlan }>())
export const addPlanSuccess  = createAction('[Plan] Add Success',  props<{ plan: TestPlan }>())
export const addPlanFailure  = createAction('[Plan] Add Failure',  props<{ error: string }>())
export const updatePlan      = createAction('[Plan] Update',       props<{ plan: TestPlan }>())
export const concludePlan    = createAction('[Plan] Conclude',     props<{ id: string }>())

// ─── Scenarios ───────────────────────────────────────────────────────────────
export const addScenario        = createAction('[Scenarios] Add',         props<{ scenario: Scenario }>())
export const addScenarioSuccess = createAction('[Scenarios] Add Success', props<{ scenario: Scenario }>())
export const addScenarioFailure = createAction('[Scenarios] Add Failure', props<{ error: string }>())
export const updateScenario      = createAction('[Scenarios] Update', props<{ scenario: Scenario }>())
export const deleteScenario      = createAction('[Scenarios] Delete', props<{ id: string }>())

// ─── Issues ──────────────────────────────────────────────────────────────────
export const addIssue        = createAction('[Issues] Add',         props<{ issue: Issue }>())
export const addIssueSuccess = createAction('[Issues] Add Success', props<{ issue: Issue }>())
export const addIssueFailure = createAction('[Issues] Add Failure', props<{ error: string }>())
export const updateIssue     = createAction('[Issues] Update', props<{ issue: Issue }>())
export const deleteIssue     = createAction('[Issues] Delete', props<{ id: string }>())

// ─── Areas ───────────────────────────────────────────────────────────────────
export const addArea        = createAction('[Areas] Add',         props<{ area: Area }>())
export const addAreaSuccess = createAction('[Areas] Add Success', props<{ area: Area }>())
export const addAreaFailure = createAction('[Areas] Add Failure', props<{ error: string }>())
export const updateArea     = createAction('[Areas] Update', props<{ area: Area }>())
export const deleteArea     = createAction('[Areas] Delete', props<{ id: string }>())

// ─── Users ───────────────────────────────────────────────────────────────────
// addUser não tem `id` ainda: o id real só existe depois que a Netlify
// Function cria o usuário no Supabase Auth (profiles.id -> auth.users.id).
export const addUser        = createAction('[Users] Add',         props<{ user: Omit<User, 'id'> }>())
export const addUserSuccess = createAction('[Users] Add Success', props<{ user: User }>())
export const addUserFailure = createAction('[Users] Add Failure', props<{ error: string }>())
export const updateUser     = createAction('[Users] Update',      props<{ user: User }>())
export const deleteUser     = createAction('[Users] Delete',      props<{ id: string }>())

// ─── Versions ────────────────────────────────────────────────────────────────
export const addVersion        = createAction('[Versions] Add',         props<{ version: Version }>())
export const addVersionSuccess = createAction('[Versions] Add Success', props<{ version: Version }>())
export const addVersionFailure = createAction('[Versions] Add Failure', props<{ error: string }>())

// ─── UI ───────────────────────────────────────────────────────────────────────
export const setGlobalSearch = createAction('[UI] Set Search',      props<{ query: string }>())
export const setTheme        = createAction('[UI] Set Theme',        props<{ theme: 'light' | 'dark' }>())
export const setLoading      = createAction('[UI] Set Loading',      props<{ loading: boolean }>())
