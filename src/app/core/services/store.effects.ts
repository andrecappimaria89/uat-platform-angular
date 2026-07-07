import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MatSnackBar } from '@angular/material/snack-bar'
import { forkJoin, of } from 'rxjs'
import { switchMap, map, catchError, withLatestFrom, tap } from 'rxjs/operators'
import { DataService } from './data.service'
import * as A from './store.actions'
import { selectSelectedPlanId } from './store.selectors'
import type { AppState } from './store.reducer'

/**
 * NgRx Effects — Garantia de Integridade com Supabase
 *
 * Estratégia (para TODAS as entidades, não só Users):
 *   O estado local só é atualizado quando o Supabase CONFIRMA a operação
 *   (ação `...Success`). Se falhar, dispatcha `...Failure` e mostra um
 *   snackbar com o erro real — nunca fica só no console, e a lista nunca
 *   mostra um item que não foi de fato salvo.
 *
 * updateX$/deleteX$ continuam com `{ dispatch: false }` porque o item já
 * existe previamente no Supabase (bootstrap trouxe ele de lá); uma falha
 * de update/delete não cria um "fantasma" na lista, só deixa o dado local
 * temporariamente desatualizado — por isso o aviso via snackbar já é
 * suficiente ali, sem precisar de rollback de estado.
 */
@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private data:     DataService,
    private store:    Store<AppState>,
    private snack:    MatSnackBar,
  ) {}

  // ─── Bootstrap — carrega TUDO do Supabase ──────────────────────────────────
  bootstrap$ = createEffect(() => this.actions$.pipe(
    ofType(A.bootstrap),
    switchMap(() => forkJoin({
      scenarios: this.data.fetchScenarios(),
      issues:    this.data.fetchIssues(),
      areas:     this.data.fetchAreas(),
      users:     this.data.fetchUsers(),
      versions:  this.data.fetchVersions(),
      plans:     this.data.fetchAllPlans(),
    }).pipe(
      map(result => A.bootstrapSuccess(result)),
      catchError(e  => of(A.bootstrapFailure({ error: String(e) })))
    ))
  ))

  // ─── Plans ─────────────────────────────────────────────────────────────────
  addPlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.addPlan),
    switchMap(({ plan }) => this.data.createPlan(plan).pipe(
      map(saved => {
        if (!saved) throw new Error(`Falha ao salvar o plano "${plan.project}" no Supabase.`)
        return A.addPlanSuccess({ plan: saved })
      }),
      catchError(e => of(A.addPlanFailure({ error: e?.message || 'Falha ao criar plano.' })))
    ))
  ))

  addPlanSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addPlanSuccess),
    tap(({ plan }) => this.snack.open(`Plano "${plan.project}" criado com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addPlanFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addPlanFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar plano: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })

  updatePlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.updatePlan),
    switchMap(({ plan }) => this.data.upsertPlan(plan).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] upsertPlan falhou'); this.snack.open(`Erro ao atualizar o plano "${plan.project}" no Supabase.`, 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  concludePlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.concludePlan),
    withLatestFrom(this.store.select(state => (state as any).app)),
    switchMap(([{ id }, appState]) => {
      const plan = appState.plans.find((p: any) => p.id === id)
      if (!plan) return of(false)
      return this.data.upsertPlan({
        ...plan,
        status:       'concluido',
        concluded_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }).pipe(tap(ok => { if (!ok) { console.error('[Effects] concludePlan falhou'); this.snack.open('Erro ao concluir o plano no Supabase.', 'OK', { duration: 6000 }) } }))
    })
  ), { dispatch: false })

  // ─── Scenarios ──────────────────────────────────────────────────────────────
  addScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.addScenario),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ scenario }, planId]) => {
      const withProject = { ...scenario, project_id: scenario.project_id || planId || undefined }
      return this.data.createScenario(withProject).pipe(
        map(saved => {
          if (!saved) throw new Error(`Falha ao salvar o cenário "${scenario.ct_id}" no Supabase.`)
          return A.addScenarioSuccess({ scenario: saved })
        }),
        catchError(e => of(A.addScenarioFailure({ error: e?.message || 'Falha ao criar cenário.' })))
      )
    })
  ))

  addScenarioSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addScenarioSuccess),
    tap(({ scenario }) => this.snack.open(`Cenário "${scenario.ct_id}" criado com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addScenarioFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addScenarioFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar cenário: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })

  updateScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateScenario),
    switchMap(({ scenario }) => this.data.updateScenario(scenario).pipe(
      tap(ok => {
        if (!ok) { console.error('[Effects] updateScenario falhou:', scenario.ct_id); this.snack.open(`Erro ao atualizar o cenário "${scenario.ct_id}".`, 'OK', { duration: 6000 }) }
      })
    ))
  ), { dispatch: false })

  deleteScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteScenario),
    switchMap(({ id }) => this.data.deleteScenario(id).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] deleteScenario falhou:', id); this.snack.open('Erro ao excluir o cenário.', 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  // ─── Issues ─────────────────────────────────────────────────────────────────
  addIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.addIssue),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ issue }, planId]) => {
      const withProject = { ...issue, project_id: issue.project_id || planId || undefined }
      return this.data.createIssue(withProject).pipe(
        map(saved => {
          if (!saved) throw new Error(`Falha ao salvar a issue "${issue.issue_id}" no Supabase.`)
          return A.addIssueSuccess({ issue: saved })
        }),
        catchError(e => of(A.addIssueFailure({ error: e?.message || 'Falha ao criar issue.' })))
      )
    })
  ))

  addIssueSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addIssueSuccess),
    tap(({ issue }) => this.snack.open(`Issue "${issue.issue_id}" criada com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addIssueFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addIssueFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar issue: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })

  updateIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateIssue),
    switchMap(({ issue }) => this.data.updateIssue(issue).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] updateIssue falhou:', issue.issue_id); this.snack.open(`Erro ao atualizar a issue "${issue.issue_id}".`, 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  deleteIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteIssue),
    switchMap(({ id }) => this.data.deleteIssue(id).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] deleteIssue falhou:', id); this.snack.open('Erro ao excluir a issue.', 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  // ─── Areas ─────────────────────────────────────────────────────────────────
  addArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.addArea),
    switchMap(({ area }) => this.data.createArea(area).pipe(
      map(saved => {
        if (!saved) throw new Error(`Falha ao salvar a área "${area.name}" no Supabase.`)
        return A.addAreaSuccess({ area: saved })
      }),
      catchError(e => of(A.addAreaFailure({ error: e?.message || 'Falha ao criar área.' })))
    ))
  ))

  addAreaSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addAreaSuccess),
    tap(({ area }) => this.snack.open(`Área "${area.name}" criada com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addAreaFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addAreaFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar área: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })

  updateArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateArea),
    switchMap(({ area }) => this.data.updateArea(area).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] updateArea falhou'); this.snack.open(`Erro ao atualizar a área "${area.name}".`, 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  deleteArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteArea),
    switchMap(({ id }) => this.data.deleteArea(id).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] deleteArea falhou'); this.snack.open('Erro ao excluir a área.', 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  // ─── Users ─────────────────────────────────────────────────────────────────
  // profiles.id tem FK para auth.users(id) — o id real só existe depois que a
  // Netlify Function create-user cria o usuário no Auth. addUser$ espera a
  // confirmação do backend antes de atualizar o estado.
  addUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.addUser),
    switchMap(({ user }) => this.data.createUser(user).pipe(
      map(saved => A.addUserSuccess({ user: saved })),
      catchError(e => of(A.addUserFailure({ error: e?.message || 'Falha ao criar usuário.' })))
    ))
  ))

  addUserSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addUserSuccess),
    tap(({ user }) => this.snack.open(`Usuário "${user.name}" criado com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addUserFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addUserFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar usuário: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })

  updateUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateUser),
    switchMap(({ user }) => this.data.updateUser(user).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] updateUser falhou'); this.snack.open(`Erro ao atualizar o usuário "${user.name}".`, 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  deleteUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteUser),
    switchMap(({ id }) => this.data.deleteUser(id).pipe(
      tap(ok => { if (!ok) { console.error('[Effects] deleteUser falhou'); this.snack.open('Erro ao desativar o usuário.', 'OK', { duration: 6000 }) } })
    ))
  ), { dispatch: false })

  // ─── Versions ──────────────────────────────────────────────────────────────
  addVersion$ = createEffect(() => this.actions$.pipe(
    ofType(A.addVersion),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ version }, planId]) =>
      this.data.createVersion({ ...version, plan_id: version.plan_id || planId || undefined }).pipe(
        map(saved => {
          if (!saved) throw new Error(`Falha ao salvar a versão "${version.version}" no Supabase.`)
          return A.addVersionSuccess({ version: saved })
        }),
        catchError(e => of(A.addVersionFailure({ error: e?.message || 'Falha ao criar versão.' })))
      )
    )
  ))

  addVersionSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(A.addVersionSuccess),
    tap(({ version }) => this.snack.open(`Versão "${version.version}" criada com sucesso.`, 'OK', { duration: 3000 }))
  ), { dispatch: false })

  addVersionFailure$ = createEffect(() => this.actions$.pipe(
    ofType(A.addVersionFailure),
    tap(({ error }) => this.snack.open(`Erro ao criar versão: ${error}`, 'OK', { duration: 6000 }))
  ), { dispatch: false })
}
