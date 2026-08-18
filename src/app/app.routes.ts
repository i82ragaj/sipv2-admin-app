import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'Inicio · SIPV2 Admin',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users-list.component').then((m) => m.UsersListComponent),
        title: 'Usuarios · SIPV2 Admin',
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles-list.component').then((m) => m.RolesListComponent),
        title: 'Roles · SIPV2 Admin',
      },
      {
        path: 'parkings',
        loadComponent: () =>
          import('./features/parkings/parkings-list.component').then((m) => m.ParkingsListComponent),
        title: 'Parkings · SIPV2 Admin',
      },
      {
        path: 'parking-statuses',
        loadComponent: () =>
          import('./features/parking-statuses/parking-statuses-list.component').then(
            (m) => m.ParkingStatusesListComponent,
          ),
        title: 'Estado de parkings · SIPV2 Admin',
      },
      {
        path: 'parking-summaries',
        loadComponent: () =>
          import('./features/parking-summaries/parking-summaries-list.component').then(
            (m) => m.ParkingSummariesListComponent,
          ),
        title: 'Informe ERP · SIPV2 Admin',
      },
      {
        path: 'counter-configs',
        loadComponent: () =>
          import('./features/counter-configs/counter-configs-list.component').then(
            (m) => m.CounterConfigsListComponent,
          ),
        title: 'Configuración de contadores · SIPV2 Admin',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
