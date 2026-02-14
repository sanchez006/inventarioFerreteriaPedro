import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ListaProductoComponent } from './features/productos/lista-producto/lista-producto.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'productos', component: ListaProductoComponent, canActivate: [AuthGuard] },
  { path: 'productos/nuevo', loadComponent: () => import('./features/productos/nuevo-producto/nuevo-producto.component').then(m => m.NuevoProductoComponent), canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
