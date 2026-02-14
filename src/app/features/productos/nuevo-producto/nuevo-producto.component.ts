import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-producto.component.html',
  styleUrls: ['./nuevo-producto.component.css']
})
export class NuevoProductoComponent {
  nombre = '';
  descripcion = '';
  precio_compra: number | null = null;
  precio_venta: number | null = null;
  cantidad: number | null = null;
  stock_minimo: number | null = null;

  constructor(private productoService: ProductoService, private router: Router) {}

  submit() {
    const payload: any = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio_compra: this.precio_compra || 0,
      precio_venta: this.precio_venta || 0,
      cantidad: this.cantidad || 0,
      stock_minimo: this.stock_minimo || 0
    };
    this.productoService.agregarProducto(payload).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err) => console.error('Error al crear producto', err)
    });
  }
}
