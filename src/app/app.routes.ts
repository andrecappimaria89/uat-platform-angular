import { Routes } from '@angular/router'

export const APP_ROUTES: Routes = [
  { path: '',          loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'plano',     loadComponent: () => import('./features/plan/plan.component').then(m => m.PlanComponent) },
  { path: 'cenarios',  loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent) },
  { path: 'issues',    loadComponent: () => import('./features/issues/issues.component').then(m => m.IssuesComponent) },
  { path: 'sumario',   loadComponent: () => import('./features/sumario/sumario.component').then(m => m.SumarioComponent) },
  { path: 'historico', loadComponent: () => import('./features/historico/historico.component').then(m => m.HistoricoComponent) },
  { path: 'areas',     loadComponent: () => import('./features/areas/areas.component').then(m => m.AreasComponent) },
  { path: 'usuarios',  loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
  { path: 'importar',  loadComponent: () => import('./features/importar/importar.component').then(m => m.ImportarComponent) },
  { path: 'config',    loadComponent: () => import('./features/config/config.component').then(m => m.ConfigComponent) },
  { path: '**', redirectTo: '' },
]
