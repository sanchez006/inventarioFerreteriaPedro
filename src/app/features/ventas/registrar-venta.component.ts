import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registrar-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="venta-tarjeta">
    <div class="venta-header">
      <button routerLink="/menu" class="btn-menu">Menú principal</button>
      <h2><span class="material-icons">point_of_sale</span> Registrar Venta</h2>
    </div>
    <form (ngSubmit)="registrarVenta()" class="form-tarjeta">
      <div *ngFor="let item of ventaItems; let i = index" class="venta-item">
        <select [(ngModel)]="item.producto_id" name="producto{{i}}" required (change)="actualizarPrecio(i)">
          <option value="" disabled>Selecciona producto</option>
          <option *ngFor="let p of productos" [value]="p.id">{{p.nombre}} (Stock: {{p.cantidad}})</option>
        </select>
        <input type="number" [(ngModel)]="item.cantidad" name="cantidad{{i}}" min="1" placeholder="Cantidad" required>
        <input type="number" [(ngModel)]="item.precio_unitario" name="precio{{i}}" min="0" placeholder="Precio unitario" readonly>
        <button type="button" class="btn-eliminar" (click)="eliminarItem(i)"><span class="material-icons">delete</span></button>
      </div>
      <button type="button" class="btn-agregar" (click)="agregarItem()"><span class="material-icons">add</span> Agregar producto</button>
      <div class="venta-resumen">
        <strong>Total: {{calcularTotal() | currency:'Q':'symbol':'1.2-2':'es-GT'}}</strong>
      </div>
      <button type="submit" class="btn-registrar">Registrar venta</button>
    </form>
    <div *ngIf="mensaje" class="mensaje">{{mensaje}}</div>
  </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
    .venta-tarjeta { max-width: 800px; margin: 2.5rem auto; background: #fff; border-radius: 18px; padding: 2.2rem 2rem 2rem 2rem; box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10); }
    .venta-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .venta-header h2 { font-size: 2rem; font-weight: 800; color: #1976d2; display: flex; align-items: center; gap: 0.7rem; }
    .btn-menu { background: linear-gradient(90deg, #ff9800 0%, #388e3c 100%); color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.5rem; font-size: 1.1rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.10); cursor: pointer; transition: background 0.2s, box-shadow 0.2s, transform 0.1s; }
    .btn-menu:hover { background: linear-gradient(90deg, #388e3c 0%, #1976d2 100%); box-shadow: 0 4px 16px rgba(0,0,0,0.15); transform: translateY(-2px) scale(1.03); }
    .form-tarjeta { display: flex; flex-direction: column; gap: 1.1rem; }
    .venta-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      position: relative;
      flex-wrap: wrap;
      overflow: visible;
    }
    .venta-item select,
    .venta-item input {
      max-width: 220px;
      flex: 1 1 160px;
      min-width: 100px;
    }
    .btn-eliminar {
      flex: 0 0 40px;
      margin-left: 0.2rem;
    }
    select, input { padding: 0.7rem 1rem; border-radius: 8px; border: 1px solid #ccc; font-size: 1.08rem; background: #f5f5f5; transition: border 0.2s; }
    select:focus, input:focus { border: 1.5px solid #1976d2; outline: none; }
    .btn-eliminar {
      background: #f5f5f5;
      color: #b22222;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 0.7rem;
      font-size: 1.3rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 40px;
      max-width: 40px;
      max-height: 40px;
      box-sizing: border-box;
    }
    .btn-eliminar .material-icons {
      font-size: 1.5rem;
      margin: 0;
    }
    .btn-eliminar:hover { background: #b22222; color: #fff; }
    .btn-agregar { background: #e3e3e3; color: #1976d2; border: none; border-radius: 8px; padding: 0.5rem 1.2rem; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.3rem; }
    .btn-agregar:hover { background: #1976d2; color: #fff; }
    .venta-resumen { margin: 1rem 0; font-size: 1.15rem; }
    .btn-registrar { background: #388e3c; color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1.5rem; font-size: 1.1rem; font-weight: 700; margin-top: 1.2rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.10); transition: background 0.2s, box-shadow 0.2s, transform 0.1s; }
    .btn-registrar:hover { background: #1976d2; box-shadow: 0 4px 16px rgba(0,0,0,0.15); transform: translateY(-2px) scale(1.03); }
    .mensaje { color: #388e3c; margin-top: 1rem; font-weight: 600; }
  `]
})
export class RegistrarVentaComponent implements OnInit {
  productos: any[] = [];
  ventaItems: any[] = [{ producto_id: '', cantidad: 1, precio_unitario: 0 }];
  mensaje = '';

  // Paginación para detalle de venta
  paginaActual: number = 1;
  tamanoPagina: number = 10;
  get totalPaginas(): number {
    return Math.ceil(this.ventaItems.length / this.tamanoPagina) || 1;
  }
  get ventaItemsPagina() {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.ventaItems.slice(inicio, inicio + this.tamanoPagina);
  }
  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:3001/productos').subscribe({
      next: (data) => {
        this.productos = data;
        this.ventaItems.forEach((item, i) => {
          if (item.producto_id) this.actualizarPrecio(i);
        });
      },
      error: () => this.mensaje = 'Error al cargar productos'
    });
  }

  agregarItem() {
    this.ventaItems.push({ producto_id: '', cantidad: 1, precio_unitario: 0 });
  }

  eliminarItem(i: number) {
    this.ventaItems.splice(i, 1);
    // Si la página actual queda vacía, retrocede una página si es posible
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
  }

  actualizarPrecio(i: number) {
    const item = this.ventaItems[i];
    const producto = this.productos.find(p => p.id == item.producto_id);
    item.precio_unitario = producto && producto.precio_venta ? producto.precio_venta : 0;
  }

  calcularTotal() {
    return this.ventaItems.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
  }

  registrarVenta() {
    const usuario = JSON.parse(localStorage.getItem('user') || '{}');
    if (!usuario.id) {
      this.mensaje = 'Usuario no identificado';
      return;
    }
    if (!['admin', 'vendedor'].includes(usuario.rol)) {
      this.mensaje = 'No tienes permisos para registrar ventas.';
      return;
    }
    const productos = this.ventaItems.filter(item => item.producto_id && item.cantidad > 0);
    if (productos.length === 0) {
      this.mensaje = 'Agrega al menos un producto';
      return;
    }
    this.http.post('http://localhost:3001/ventas', { productos }).subscribe({
      next: () => {
        this.mensaje = 'Venta registrada correctamente';
        this.ventaItems = [{ producto_id: '', cantidad: 1, precio_unitario: 0 }];
        this.paginaActual = 1;
        this.ngOnInit(); // recargar productos
      },
      error: (err) => {
        this.mensaje = 'Error al registrar venta: ' + (err?.error?.mensaje || err.message);
      }
    });
  }
}
