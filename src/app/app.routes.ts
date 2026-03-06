import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ListaProductoComponent } from './features/productos/lista-producto/lista-producto.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './core/auth.guard';
import { ReporteComprasComponent } from './features/reportes/reporte-compras.component';
import { MenuPrincipalComponent } from './pages/menu-principal.component';

export const routes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: 'movimientos', loadComponent: () => import('./features/movimientos/movimientos.component').then(m => m.MovimientosComponent), canActivate: [AuthGuard] },
  { path: 'menu', component: MenuPrincipalComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'productos', component: ListaProductoComponent, canActivate: [AuthGuard] },
  { path: 'productos/nuevo', loadComponent: () => import('./features/productos/nuevo-producto/nuevo-producto.component').then(m => m.NuevoProductoComponent), canActivate: [AuthGuard] },
  { path: 'ventas', loadComponent: () => import('./features/ventas/registrar-venta.component').then(m => m.RegistrarVentaComponent), canActivate: [AuthGuard] },
  { path: 'compras', loadComponent: () => import('./features/compras/registrar-compra.component').then(m => m.RegistrarCompraComponent), canActivate: [AuthGuard] },
  { path: 'alertas-stock', loadComponent: () => import('./features/alertas-stock/alertas-stock.component').then(m => m.AlertasStockComponent), canActivate: [AuthGuard] },
  { path: 'reportes/ventas', loadComponent: () => import('./features/reportes/reporte-ventas.component').then(m => m.ReporteVentasComponent), canActivate: [AuthGuard] },
  { path: 'reportes/compras', loadComponent: () => import('./features/reportes/reporte-compras.component').then(m => m.ReporteComprasComponent), canActivate: [AuthGuard] },
  { path: 'proveedores', loadComponent: () => import('./features/proveedores/lista-proveedores.component').then(m => m.ListaProveedoresComponent), canActivate: [AuthGuard] },
  { path: 'categorias', loadComponent: () => import('./features/categorias/lista-categorias.component').then(m => m.ListaCategoriasComponent), canActivate: [AuthGuard] },
  { path: 'presupuestos', loadChildren: () => import('./features/presupuestos/presupuestos.module').then(m => m.PresupuestosModule), canActivate: [AuthGuard] },
  // Eliminado redirectTo duplicado para evitar conflicto de rutas
];
