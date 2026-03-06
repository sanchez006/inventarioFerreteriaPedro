import { AuthService } from '../../../core/services/auth.service';


import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../../core/services/producto.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FiltroProductosPipe } from './filtro-productos.pipe';

@Component({
  selector: 'app-lista-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-producto.component.html',
  styleUrl: './lista-producto.component.css'
})
export class ListaProductoComponent implements OnInit {
  role: string = '';

  productos: any[] = [];
  filtro: string = '';
  modalAbierto: boolean = false;
  productoEdit: any = {};
  categorias: any[] = [];
  proveedores: any[] = [];

  // Paginación
  paginaActual: number = 1;
  tamanoPagina: number = 15;
  get totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.tamanoPagina) || 1;
  }

  constructor(
    private productoServicio: ProductoService,
    private catalogosService: CatalogosService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.role = this.auth.getRole();
    this.catalogosService.obtenerCategorias().subscribe(data => this.categorias = data);
    this.catalogosService.obtenerProveedores().subscribe(data => this.proveedores = data);
  }

  cargarProductos() {
    this.productoServicio.mostrarProductos().subscribe((data: any[]) => {
      this.productos = data;
      this.paginaActual = 1;
    });
  }

  get productosFiltrados(): any[] {
    // Aplica el filtro igual que el pipe, para paginar sobre el resultado filtrado
    if (!this.filtro) return this.productos;
    const f = this.filtro.toLowerCase();
    return this.productos.filter(p =>
      (p.nombre || '').toLowerCase().includes(f) ||
      (p.descripcion || '').toLowerCase().includes(f) ||
      (p.categoria || '').toLowerCase().includes(f) ||
      (p.proveedor || '').toLowerCase().includes(f)
    );
  }

  get productosPagina(): any[] {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.tamanoPagina);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
  }

  abrirModalEditar(producto: any) {
    this.productoEdit = { ...producto };
    this.modalAbierto = true;
    setTimeout(() => {
      const modal = document.querySelector('.modal');
      if (modal) (modal as HTMLElement).focus();
    }, 100);
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.productoEdit = {};
  }

  guardarEdicion() {
    if (!this.productoEdit.id) return;
    this.productoServicio.actualizarProducto(this.productoEdit.id, this.productoEdit).subscribe({
      next: () => {
        this.cargarProductos();
        this.cerrarModal();
      },
      error: (err) => alert('Error al actualizar producto: ' + (err?.error?.message || err))
    });
  }

  eliminarProducto(id: number) {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      this.productoServicio.eliminarProducto(id).subscribe({
        next: () => this.cargarProductos(),
        error: (err) => alert('Error al eliminar producto: ' + (err?.error?.message || err))
      });
    }
  }
}
