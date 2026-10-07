import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
    { path: 'search', loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) },
    { path: 'pharmacy/:id', loadComponent: () => import('./pharmacy-detail/pharmacy-detail.component').then(m => m.PharmacyDetailComponent) },
    { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },

    { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
    { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
    { path: 'reset-password', loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
    {
        path: 'patient',
        loadComponent: () => import('./patient/patient.component').then(m => m.PatientComponent)
    },

    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard, roleGuard(['pharmacist', 'admin'])]
    },
    {
        path: 'stats',
        loadComponent: () => import('./stats/stats.component').then(m => m.StatsComponent),
        canActivate: [authGuard, roleGuard(['pharmacist', 'admin'])]
    },
    {
        path: 'orders',
        loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent),
        canActivate: [authGuard, roleGuard(['pharmacist', 'admin'])]
    },
    {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
        canActivate: [authGuard, roleGuard(['admin'])]
    },
    {
        path: 'pos',
        loadComponent: () => import('./admin/pos/pos.component').then(m => m.PosComponent),
        canActivate: [authGuard, roleGuard(['pharmacist', 'admin'])]
    },
    {
        path: 'gardes',
        loadComponent: () => import('./gardes/gardes.component').then(m => m.GardesComponent),
        canActivate: [authGuard, roleGuard(['pharmacist', 'admin'])]
    },
    { path: '**', redirectTo: '/home' }
];
