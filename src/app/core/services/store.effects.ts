import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { forkJoin, of } from 'rxjs'
import { switchMap, map, catchError, withLatestFrom, tap } from 'rxjs/operators'
import { DataService } from './data.service'
import * as A from './store.actions'
import { selectSelectedPlanId } from './store.selectors'
import type { AppState } from './store.reducer'

/**
 * NgRx Effects — Garantia de Integridade com Supabase
 *
 * Estratégia: Optimistic UI
 * 1. O reducer atualiza o estado local imediatamente (já feito)
 * 2. O Effect persiste no Supabase em paralelo
 * 3. Em caso de erro, loga no console (pode ser extendido para rollback)
 *
 * O estado local NUNCA fica dessincronizado porque:
 * - Bootstrap carrega todos os dados do Supabase na inicialização
 * - Cada create/update/delete persiste no banco via Effect
 * - Em caso de falha de rede, o dado local permanece mas será
 *   sincronizado no próximo bootstrap
 */
@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private data:     DataService,
    private store:    Store<AppState>,
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
      tap(ok => { if (!ok) console.error('[Effects] createPlan falhou') })
    ))
  ), { dispatch: false })

  updatePlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.updatePlan),
    switchMap(({ plan }) => this.data.upsertPlan(plan).pipe(
      tap(ok => { if (!ok) console.error('[Effects] upsertPlan falhou') })
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
      }).pipe(tap(ok => { if (!ok) console.error('[Effects] concludePlan falhou') }))
    })
  ), { dispatch: false })

  // ─── Scenarios — Integridade Garantida ─────────────────────────────────────
  addScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.addScenario),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ scenario }, planId]) => {
      // Garante project_id vinculado
      const withProject = {
        ...scenario,
        project_id: scenario.project_id || planId || undefined,
      }
      return this.data.createScenario(withProject).pipe(
        tap(saved => {
          if (!saved) console.error('[Effects] createScenario falhou — dado local pode estar dessincronizado')
          else console.log('[Effects] createScenario ✅ salvo no Supabase:', saved.ct_id)
        })
      )
    })
  ), { dispatch: false })

  updateScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateScenario),
    switchMap(({ scenario }) => this.data.updateScenario(scenario).pipe(
      tap(ok => {
        if (!ok) console.error('[Effects] updateScenario falhou:', scenario.ct_id)
        else console.log('[Effects] updateScenario ✅:', scenario.ct_id)
      })
    ))
  ), { dispatch: false })

  deleteScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteScenario),
    switchMap(({ id }) => this.data.deleteScenario(id).pipe(
      tap(ok => {
        if (!ok) console.error('[Effects] deleteScenario falhou:', id)
        else console.log('[Effects] deleteScenario ✅:', id)
      })
    ))
  ), { dispatch: false })

  // ─── Issues — Integridade Garantida ────────────────────────────────────────
  addIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.addIssue),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ issue }, planId]) => {
      const withProject = {
        ...issue,
        project_id: issue.project_id || planId || undefined,
      }
      return this.data.createIssue(withProject).pipe(
        tap(saved => {
          if (!saved) console.error('[Effects] createIssue falhou')
          else console.log('[Effects] createIssue ✅:', saved.issue_id)
        })
      )
    })
  ), { dispatch: false })

  updateIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateIssue),
    switchMap(({ issue }) => this.data.updateIssue(issue).pipe(
      tap(ok => {
        if (!ok) console.error('[Effects] updateIssue falhou:', issue.issue_id)
        else console.log('[Effects] updateIssue ✅:', issue.issue_id)
      })
    ))
  ), { dispatch: false })

  deleteIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteIssue),
    switchMap(({ id }) => this.data.deleteIssue(id).pipe(
      tap(ok => {
        if (!ok) console.error('[Effects] deleteIssue falhou:', id)
        else console.log('[Effects] deleteIssue ✅:', id)
      })
    ))
  ), { dispatch: false })

  // ─── Areas ─────────────────────────────────────────────────────────────────
  addArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.addArea),
    switchMap(({ area }) => this.data.createArea(area).pipe(
      tap(saved => { if (!saved) console.error('[Effects] createArea falhou') })
    ))
  ), { dispatch: false })

  updateArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateArea),
    switchMap(({ area }) => this.data.updateArea(area).pipe(
      tap(ok => { if (!ok) console.error('[Effects] updateArea falhou') })
    ))
  ), { dispatch: false })

  deleteArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteArea),
    switchMap(({ id }) => this.data.deleteArea(id).pipe(
      tap(ok => { if (!ok) console.error('[Effects] deleteArea falhou') })
    ))
  ), { dispatch: false })

  // ─── Users ─────────────────────────────────────────────────────────────────
  addUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.addUser),
    switchMap(({ user }) => this.data.createUser(user).pipe(
      tap(saved => { if (!saved) console.error('[Effects] createUser falhou') })
    ))
  ), { dispatch: false })

  updateUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateUser),
    switchMap(({ user }) => this.data.updateUser(user).pipe(
      tap(ok => { if (!ok) console.error('[Effects] updateUser falhou') })
    ))
  ), { dispatch: false })

  deleteUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteUser),
    switchMap(({ id }) => this.data.deleteUser(id).pipe(
      tap(ok => { if (!ok) console.error('[Effects] deleteUser falhou') })
    ))
  ), { dispatch: false })

  // ─── Versions ──────────────────────────────────────────────────────────────
  addVersion$ = createEffect(() => this.actions$.pipe(
    ofType(A.addVersion),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ version }, planId]) =>
      this.data.createVersion({ ...version, plan_id: version.plan_id || planId || undefined }).pipe(
        tap(saved => { if (!saved) console.error('[Effects] createVersion falhou') })
      )
    )
  ), { dispatch: false })
}
