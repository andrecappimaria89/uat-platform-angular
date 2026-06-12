import { Injectable } from '@angular/core'
import { from, Observable, of, throwError } from 'rxjs'
import { map, catchError, tap } from 'rxjs/operators'
import { SupabaseService } from './supabase.service'
import type { Scenario, Issue, Area, User, Version, TestPlan } from '../models'

/**
 * DataService — Angular
 * Mesma lógica do dataService.ts React, adaptada para RxJS Observables.
 * O banco Supabase é IDÊNTICO — nenhuma alteração necessária no schema.
 */
@Injectable({ providedIn: 'root' })
export class DataService {

  constructor(private sb: SupabaseService) {}

  private get db() { return this.sb.client }

  private notReady<T>(fn: string): Observable<T[]> {
    console.warn(`[DataService] Supabase não configurado — ${fn} retornou vazio.`)
    return of([] as T[])
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private mapScenario(r: any): Scenario {
    return {
      id: r.id, ct_id: r.ct_id, ef_id: r.ef_id,
      planned_date: r.planned_date, responsible_id: r.responsible_id,
      responsible_name: r.responsible_name, area_id: r.area_id, area_name: r.area_name,
      scenario: r.scenario, feature: r.feature, preconditions: r.preconditions,
      gherkin: { dado: r.gherkin_dado ?? '', quando: r.gherkin_quando ?? '', entao: r.gherkin_entao ?? '' },
      expected_result: r.expected_result, expected_evidence: r.expected_evidence,
      execution_date: r.execution_date, effective_executor: r.effective_executor,
      obtained_result: r.obtained_result, realized_evidence: r.realized_evidence,
      status: r.status, comments: r.comments, project_id: r.project_id,
      created_at: r.created_at, updated_at: r.updated_at,
    }
  }

  private mapIssue(r: any): Issue {
    return {
      id: r.id, issue_id: r.issue_id, title: r.title, description: r.description,
      scenario_id: r.scenario_id, scenario_ct: r.scenario_ct,
      responsible_id: r.responsible_id, responsible_name: r.responsible_name,
      area_id: r.area_id, area_name: r.area_name,
      severity: r.severity, priority: r.priority, status: r.status,
      opened_at: r.opened_at, deadline: r.deadline, closed_at: r.closed_at,
      observations: r.observations, evidences: r.evidences, comments: r.comments,
      project_id: r.project_id, created_at: r.created_at, updated_at: r.updated_at,
    }
  }

  private mapArea(r: any): Area {
    return { id: r.id, name: r.name, responsible_id: r.responsible_id, responsible_name: r.responsible_name, created_at: r.created_at }
  }

  private mapUser(r: any): User {
    return { id: r.id, name: r.name, email: r.email, role: r.role, area_id: r.area_id, area_name: r.area_name, avatar_initials: r.avatar_initials, active: r.active, created_at: r.created_at }
  }

  private mapVersion(r: any): Version {
    return { id: r.id, version: r.version, date: r.date, responsible_id: r.responsible_id, responsible_name: r.responsible_name, description: r.description, justification: r.justification, plan_id: r.plan_id, created_at: r.created_at }
  }

  private mapPlan(r: any): TestPlan {
    return { id: r.id, project: r.project, objective: r.objective, scope: r.scope, systems: r.systems, responsible_area: r.responsible_area, stakeholders: r.stakeholders, executors: r.executors, start_date: r.start_date, end_date: r.end_date, environments: r.environments, premises: r.premises, dependencies: r.dependencies, risks: r.risks, entry_criteria: r.entry_criteria, exit_criteria: r.exit_criteria, observations: r.observations, status: r.status ?? 'aberto', concluded_at: r.concluded_at, created_at: r.created_at, updated_at: r.updated_at }
  }

  // ─── SCENARIOS ─────────────────────────────────────────────────────────────

  fetchScenarios(): Observable<Scenario[]> {
    if (!this.db) return this.notReady('fetchScenarios')
    return from(this.db.from('scenarios').select('*').order('created_at', { ascending: true })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapScenario(r)) }),
      catchError(e => { console.error('fetchScenarios:', e.message); return of([]) })
    )
  }

  createScenario(s: Scenario): Observable<Scenario | null> {
    if (!this.db) return of(s)
    return from(this.db.from('scenarios').insert([{
      id: s.id, ct_id: s.ct_id, ef_id: s.ef_id,
      planned_date: s.planned_date || null,
      responsible_name: s.responsible_name, area_name: s.area_name,
      scenario: s.scenario, feature: s.feature, preconditions: s.preconditions,
      gherkin_dado: s.gherkin?.dado, gherkin_quando: s.gherkin?.quando, gherkin_entao: s.gherkin?.entao,
      expected_result: s.expected_result, expected_evidence: s.expected_evidence,
      execution_date: s.execution_date || null, effective_executor: s.effective_executor,
      obtained_result: s.obtained_result, realized_evidence: s.realized_evidence,
      status: s.status, comments: s.comments, project_id: s.project_id || null,
    }]).select().single()).pipe(
      map(({ data, error }) => { if (error) throw error; return this.mapScenario(data) }),
      catchError(e => { console.error('createScenario:', e.message); return of(null) })
    )
  }

  updateScenario(s: Scenario): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('scenarios').update({
      ct_id: s.ct_id, ef_id: s.ef_id, planned_date: s.planned_date || null,
      responsible_name: s.responsible_name, area_name: s.area_name,
      scenario: s.scenario, feature: s.feature, preconditions: s.preconditions,
      gherkin_dado: s.gherkin?.dado, gherkin_quando: s.gherkin?.quando, gherkin_entao: s.gherkin?.entao,
      expected_result: s.expected_result, expected_evidence: s.expected_evidence,
      execution_date: s.execution_date || null, effective_executor: s.effective_executor,
      obtained_result: s.obtained_result, realized_evidence: s.realized_evidence,
      status: s.status, comments: s.comments, project_id: s.project_id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', s.id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('updateScenario:', e.message); return of(false) })
    )
  }

  deleteScenario(id: string): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('scenarios').delete().eq('id', id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('deleteScenario:', e.message); return of(false) })
    )
  }

  // ─── ISSUES ────────────────────────────────────────────────────────────────

  fetchIssues(): Observable<Issue[]> {
    if (!this.db) return this.notReady('fetchIssues')
    return from(this.db.from('issues').select('*').order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapIssue(r)) }),
      catchError(e => { console.error('fetchIssues:', e.message); return of([]) })
    )
  }

  createIssue(i: Issue): Observable<Issue | null> {
    if (!this.db) return of(i)
    return from(this.db.from('issues').insert([{
      id: i.id, issue_id: i.issue_id, title: i.title, description: i.description,
      scenario_ct: i.scenario_ct, responsible_name: i.responsible_name, area_name: i.area_name,
      severity: i.severity, priority: i.priority, status: i.status,
      opened_at: i.opened_at, deadline: i.deadline || null,
      observations: i.observations, evidences: i.evidences, comments: i.comments,
      project_id: i.project_id || null,
    }]).select().single()).pipe(
      map(({ data, error }) => { if (error) throw error; return this.mapIssue(data) }),
      catchError(e => { console.error('createIssue:', e.message); return of(null) })
    )
  }

  updateIssue(i: Issue): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('issues').update({
      title: i.title, description: i.description, scenario_ct: i.scenario_ct,
      responsible_name: i.responsible_name, area_name: i.area_name,
      severity: i.severity, priority: i.priority, status: i.status,
      opened_at: i.opened_at, deadline: i.deadline || null,
      closed_at: i.status === 'encerrado' ? (i.closed_at || new Date().toISOString().slice(0,10)) : null,
      observations: i.observations, evidences: i.evidences, comments: i.comments,
      updated_at: new Date().toISOString(),
    }).eq('id', i.id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('updateIssue:', e.message); return of(false) })
    )
  }

  deleteIssue(id: string): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('issues').delete().eq('id', id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('deleteIssue:', e.message); return of(false) })
    )
  }

  // ─── AREAS ─────────────────────────────────────────────────────────────────

  fetchAreas(): Observable<Area[]> {
    if (!this.db) return this.notReady('fetchAreas')
    return from(this.db.from('areas').select('*').order('name', { ascending: true })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapArea(r)) }),
      catchError(e => { console.error('fetchAreas:', e.message); return of([]) })
    )
  }

  createArea(a: Area): Observable<Area | null> {
    if (!this.db) return of(a)
    return from(this.db.from('areas').insert([{ id: a.id, name: a.name, responsible_name: a.responsible_name }]).select().single()).pipe(
      map(({ data, error }) => { if (error) throw error; return this.mapArea(data) }),
      catchError(e => { console.error('createArea:', e.message); return of(null) })
    )
  }

  updateArea(a: Area): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('areas').update({ name: a.name, responsible_name: a.responsible_name }).eq('id', a.id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('updateArea:', e.message); return of(false) })
    )
  }

  deleteArea(id: string): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('areas').delete().eq('id', id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('deleteArea:', e.message); return of(false) })
    )
  }

  // ─── USERS ─────────────────────────────────────────────────────────────────

  fetchUsers(): Observable<User[]> {
    if (!this.db) return this.notReady('fetchUsers')
    return from(this.db.from('profiles').select('*').order('name', { ascending: true })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapUser(r)) }),
      catchError(e => { console.error('fetchUsers:', e.message); return of([]) })
    )
  }

  createUser(u: User): Observable<User | null> {
    if (!this.db) return of(u)
    return from(this.db.from('profiles').insert([{ id: u.id, name: u.name, email: u.email, role: u.role, area_name: u.area_name, avatar_initials: u.avatar_initials, active: u.active }]).select().single()).pipe(
      map(({ data, error }) => { if (error) throw error; return this.mapUser(data) }),
      catchError(e => { console.error('createUser:', e.message); return of(null) })
    )
  }

  updateUser(u: User): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('profiles').update({ name: u.name, email: u.email, role: u.role, area_name: u.area_name, avatar_initials: u.avatar_initials, active: u.active }).eq('id', u.id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('updateUser:', e.message); return of(false) })
    )
  }

  deleteUser(id: string): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('profiles').update({ active: false }).eq('id', id)).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('deleteUser:', e.message); return of(false) })
    )
  }

  // ─── VERSIONS ──────────────────────────────────────────────────────────────

  fetchVersions(): Observable<Version[]> {
    if (!this.db) return this.notReady('fetchVersions')
    return from(this.db.from('versions').select('*').order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapVersion(r)) }),
      catchError(e => { console.error('fetchVersions:', e.message); return of([]) })
    )
  }

  createVersion(v: Version): Observable<Version | null> {
    if (!this.db) return of(v)
    return from(this.db.from('versions').insert([{ id: v.id, version: v.version, date: v.date, responsible_name: v.responsible_name, description: v.description, justification: v.justification, plan_id: v.plan_id || null }]).select().single()).pipe(
      map(({ data, error }) => { if (error) throw error; return this.mapVersion(data) }),
      catchError(e => { console.error('createVersion:', e.message); return of(null) })
    )
  }

  // ─── PLANS ─────────────────────────────────────────────────────────────────

  fetchAllPlans(): Observable<TestPlan[]> {
    if (!this.db) return this.notReady('fetchAllPlans')
    return from(this.db.from('test_plans').select('*').order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => this.mapPlan(r)) }),
      catchError(e => { console.error('fetchAllPlans:', e.message); return of([]) })
    )
  }

  createPlan(p: TestPlan): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('test_plans').insert([{
      id: p.id, project: p.project, objective: p.objective, scope: p.scope, systems: p.systems,
      responsible_area: p.responsible_area, stakeholders: p.stakeholders, executors: p.executors,
      start_date: p.start_date || null, end_date: p.end_date || null, environments: p.environments,
      premises: p.premises, dependencies: p.dependencies, risks: p.risks,
      entry_criteria: p.entry_criteria, exit_criteria: p.exit_criteria, observations: p.observations,
      status: p.status ?? 'aberto',
    }])).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('createPlan:', e.message); return of(false) })
    )
  }

  upsertPlan(p: TestPlan): Observable<boolean> {
    if (!this.db) return of(true)
    return from(this.db.from('test_plans').upsert({
      id: p.id, project: p.project, objective: p.objective, scope: p.scope, systems: p.systems,
      responsible_area: p.responsible_area, stakeholders: p.stakeholders, executors: p.executors,
      start_date: p.start_date || null, end_date: p.end_date || null, environments: p.environments,
      premises: p.premises, dependencies: p.dependencies, risks: p.risks,
      entry_criteria: p.entry_criteria, exit_criteria: p.exit_criteria, observations: p.observations,
      status: p.status ?? 'aberto', concluded_at: p.concluded_at || null,
      updated_at: new Date().toISOString(),
    })).pipe(
      map(({ error }) => { if (error) throw error; return true }),
      catchError(e => { console.error('upsertPlan:', e.message); return of(false) })
    )
  }
}
