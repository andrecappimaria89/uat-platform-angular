import { createSelector, createFeatureSelector } from '@ngrx/store'
import type { AppState } from './store.reducer'

export const selectAppState = createFeatureSelector<AppState>('app')

export const selectScenarios      = createSelector(selectAppState, s => s.scenarios)
export const selectIssues         = createSelector(selectAppState, s => s.issues)
export const selectAreas          = createSelector(selectAppState, s => s.areas)
export const selectUsers          = createSelector(selectAppState, s => s.users)
export const selectVersions       = createSelector(selectAppState, s => s.versions)
export const selectPlans          = createSelector(selectAppState, s => s.plans)
export const selectSelectedPlanId = createSelector(selectAppState, s => s.selectedPlanId)
export const selectLoading        = createSelector(selectAppState, s => s.loading)
export const selectGlobalSearch   = createSelector(selectAppState, s => s.globalSearch)
export const selectTheme          = createSelector(selectAppState, s => s.theme)

export const selectSelectedPlan = createSelector(
  selectPlans, selectSelectedPlanId,
  (plans, id) => plans.find(p => p.id === id) ?? null
)

export const selectIsProjectLocked = createSelector(
  selectSelectedPlan,
  plan => plan?.status === 'concluido'
)

export const selectFilteredScenarios = createSelector(
  selectScenarios, selectSelectedPlanId, selectGlobalSearch,
  (scenarios, planId, search) => {
    const q = search.toLowerCase()
    return scenarios.filter(s => {
      if (planId && s.project_id && s.project_id !== planId) return false
      if (q && !s.ct_id.toLowerCase().includes(q) &&
               !s.scenario.toLowerCase().includes(q) &&
               !s.feature?.toLowerCase().includes(q)) return false
      return true
    })
  }
)

export const selectFilteredIssues = createSelector(
  selectIssues, selectSelectedPlanId, selectGlobalSearch,
  (issues, planId, search) => {
    const q = search.toLowerCase()
    return issues.filter(i => {
      if (planId && i.project_id && i.project_id !== planId) return false
      if (q && !i.issue_id.toLowerCase().includes(q) &&
               !i.title.toLowerCase().includes(q)) return false
      return true
    })
  }
)

export const selectDashboardMetrics = createSelector(
  selectScenarios, selectIssues, selectAreas, selectSelectedPlanId,
  (allScenarios, allIssues, areas, planId) => {
    const scenarios = planId
      ? allScenarios.filter(s => !s.project_id || s.project_id === planId)
      : allScenarios
    const issues = planId
      ? allIssues.filter(i => !i.project_id || i.project_id === planId)
      : allIssues

    const total     = scenarios.length
    const todo      = scenarios.filter(s => s.status === 'todo').length
    const em_teste  = scenarios.filter(s => s.status === 'em_teste').length
    const bloqueado = scenarios.filter(s => s.status === 'bloqueado').length
    const concluido = scenarios.filter(s => s.status === 'concluido').length
    const falha     = scenarios.filter(s => s.status === 'falha').length
    const sucesso   = scenarios.filter(s => s.status === 'sucesso').length
    const executed  = total - todo

    const pctSuccess = total > 0 ? Math.round((sucesso   / total) * 100) : 0
    const pctFail    = total > 0 ? Math.round((falha     / total) * 100) : 0
    const pctExec    = total > 0 ? Math.round((executed  / total) * 100) : 0
    const pctBlocked = total > 0 ? Math.round((bloqueado / total) * 100) : 0

    const byArea = areas.map(a => {
      const s       = scenarios.filter(sc => sc.area_name === a.name)
      const success = s.filter(sc => sc.status === 'sucesso' || sc.status === 'concluido').length
      return { area: a.name, total: s.length, success }
    }).filter(a => a.total > 0)

    const issuesBySev = { S1:0,S2:0,S3:0,S4:0,S5:0 } as Record<string,number>
    const issuesByPri = { P1:0,P2:0,P3:0,P4:0 } as Record<string,number>
    issues.forEach(i => { issuesBySev[i.severity]++; issuesByPri[i.priority]++ })

    const issuesOpen     = issues.filter(i => i.status !== 'encerrado' && i.status !== 'cancelado').length
    const issuesCritical = issues.filter(i => (i.severity==='S1'||i.severity==='S2') && i.status!=='encerrado').length

    return {
      total, todo, em_teste, bloqueado, concluido, falha, sucesso, executed,
      pctSuccess, pctFail, pctExec, pctBlocked,
      byArea, issuesBySev, issuesByPri, issuesOpen, issuesCritical,
    }
  }
)
