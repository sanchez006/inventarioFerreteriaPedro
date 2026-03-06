
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './nuevo-producto.component.html',
  styleUrls: ['./nuevo-producto.component.css']
})
export class NuevoProductoComponent implements OnInit {
  nombre = '';
  descripcion = '';
  precio_compra: number | null = null;
  precio_venta: number | null = null;
  cantidad: number | null = null;
  stock_minimo: number | null = null;
  categoria_id: number | null = null;
  proveedor_id: number | null = null;
  categorias: any[] = [];
  proveedores: any[] = [];

  constructor(
    private productoService: ProductoService,
    private catalogosService: CatalogosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalogosService.obtenerCategorias().subscribe(data => this.categorias = data);
    this.catalogosService.obtenerProveedores().subscribe(data => this.proveedores = data);
  }

  submit() {
    const payload: any = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio_compra: this.precio_compra || 0,
      precio_venta: this.precio_venta || 0,
      cantidad: this.cantidad || 0,
      stock_minimo: this.stock_minimo || 0,
      categoria_id: this.categoria_id,
      proveedor_id: this.proveedor_id
    };
    this.productoService.agregarProducto(payload).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err) => console.error('Error al crear producto', err)
    });
  }
}
