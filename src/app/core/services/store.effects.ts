import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { forkJoin, of } from 'rxjs'
import { switchMap, map, catchError, withLatestFrom } from 'rxjs/operators'
import { DataService } from './data.service'
import * as A from './store.actions'
import { selectSelectedPlanId } from './store.selectors'
import type { AppState } from './store.reducer'

@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private data:     DataService,
    private store:    Store<AppState>,
  ) {}

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
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

  // ─── Plan ──────────────────────────────────────────────────────────────────
  addPlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.addPlan),
    switchMap(({ plan }) => this.data.createPlan(plan))
  ), { dispatch: false })

  updatePlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.updatePlan),
    switchMap(({ plan }) => this.data.upsertPlan(plan))
  ), { dispatch: false })

  concludePlan$ = createEffect(() => this.actions$.pipe(
    ofType(A.concludePlan),
    withLatestFrom(this.store.select(state => (state as any).app)),
    switchMap(([{ id }, appState]) => {
      const plan = appState.plans.find((p: any) => p.id === id)
      if (!plan) return of(false)
      return this.data.upsertPlan({
        ...plan, status: 'concluido',
        concluded_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
    })
  ), { dispatch: false })

  // ─── Scenarios ─────────────────────────────────────────────────────────────
  addScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.addScenario),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ scenario }, planId]) =>
      this.data.createScenario({ ...scenario, project_id: planId || undefined })
    )
  ), { dispatch: false })

  updateScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateScenario),
    switchMap(({ scenario }) => this.data.updateScenario(scenario))
  ), { dispatch: false })

  deleteScenario$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteScenario),
    switchMap(({ id }) => this.data.deleteScenario(id))
  ), { dispatch: false })

  // ─── Issues ────────────────────────────────────────────────────────────────
  addIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.addIssue),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ issue }, planId]) =>
      this.data.createIssue({ ...issue, project_id: planId || undefined })
    )
  ), { dispatch: false })

  updateIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateIssue),
    switchMap(({ issue }) => this.data.updateIssue(issue))
  ), { dispatch: false })

  deleteIssue$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteIssue),
    switchMap(({ id }) => this.data.deleteIssue(id))
  ), { dispatch: false })

  // ─── Areas ─────────────────────────────────────────────────────────────────
  addArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.addArea),
    switchMap(({ area }) => this.data.createArea(area))
  ), { dispatch: false })

  updateArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateArea),
    switchMap(({ area }) => this.data.updateArea(area))
  ), { dispatch: false })

  deleteArea$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteArea),
    switchMap(({ id }) => this.data.deleteArea(id))
  ), { dispatch: false })

  // ─── Users ─────────────────────────────────────────────────────────────────
  addUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.addUser),
    switchMap(({ user }) => this.data.createUser(user))
  ), { dispatch: false })

  updateUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.updateUser),
    switchMap(({ user }) => this.data.updateUser(user))
  ), { dispatch: false })

  deleteUser$ = createEffect(() => this.actions$.pipe(
    ofType(A.deleteUser),
    switchMap(({ id }) => this.data.deleteUser(id))
  ), { dispatch: false })

  // ─── Versions ──────────────────────────────────────────────────────────────
  addVersion$ = createEffect(() => this.actions$.pipe(
    ofType(A.addVersion),
    withLatestFrom(this.store.select(selectSelectedPlanId)),
    switchMap(([{ version }, planId]) =>
      this.data.createVersion({ ...version, plan_id: planId || undefined })
    )
  ), { dispatch: false })
}
