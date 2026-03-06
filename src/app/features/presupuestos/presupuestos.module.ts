import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PresupuestosComponent } from './presupuestos.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../../core/auth.interceptor';

const routes: Routes = [
  { path: '', component: PresupuestosComponent }
];

@NgModule({
  declarations: [PresupuestosComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
  // providers eliminado para usar el interceptor global
})
export class PresupuestosModule {}
