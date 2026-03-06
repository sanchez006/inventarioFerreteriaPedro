  // ...
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Component, OnInit } from '@angular/core';
import { ProductoService, Producto } from '../../core/services/producto.service';
import { PresupuestoService, Presupuesto, PresupuestoItem } from '../../core/services/presupuesto.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-presupuestos',
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.css']
})
export class PresupuestosComponent implements OnInit {
  isMobile(): boolean {
    return window.innerWidth <= 600;
  }
  productos: any[] = [];
  presupuestoItems: PresupuestoItem[] = [];
  cliente: string = '';
  mensaje: string = '';
  historial: Presupuesto[] = [];
  filtroCliente: string = '';
  paginaActual: number = 1;
  presupuestosPorPagina: number = 10;

  descargarPDF(p: Presupuesto) {
    const doc = new jsPDF();
    // Logo simulado y título centrado
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.text('FERRETERÍA EL BUEN PRECIO', 105, 18, { align: 'center' });
    doc.setTextColor(0,0,0);
    doc.setFontSize(14);
    doc.text('Presupuesto', 105, 28, { align: 'center' });
    doc.setFontSize(11);
    let y = 40;
    doc.text(`Cliente: ${p.cliente || ''}`, 14, y);
    y += 7;
    doc.text(`Fecha: ${p.fecha ? p.fecha.toString().slice(0, 10) : ''}`, 14, y);
    y += 7;
    doc.text(`Usuario: ${p.usuario || '—'}`, 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(120,120,120);
    doc.text('Gracias por su preferencia.', 14, y);
    doc.setTextColor(0,0,0);
    doc.setFontSize(11);
    y += 10;
    const totalNum = typeof p.total === 'number' ? p.total : Number(p.total);

    // Mostrar detalle si existe
    let items = p.items || [];
    if (!items.length && this.presupuestoItems.length && this.cliente === p.cliente) {
      items = this.presupuestoItems;
    }
    if (items.length) {
      const body = items.map(item => [
        item.nombre,
        item.cantidad,
        `Q${Number(item.precio_unitario).toFixed(2)}`,
        `Q${(item.cantidad * item.precio_unitario).toFixed(2)}`
      ]);
      // Fila de total
      body.push([
        '', '', 'TOTAL', `Q${!isNaN(totalNum) ? totalNum.toFixed(2) : '0.00'}`
      ]);
      autoTable(doc, {
        head: [['Producto', 'Cantidad', 'Precio unitario', 'Subtotal']],
        body,
        startY: y,
        styles: { fontSize: 11 },
        headStyles: { fillColor: [33, 150, 243] },
      });
    } else {
      doc.setTextColor(150, 0, 0);
      doc.text('No hay detalle de productos para este presupuesto.', 14, y + 5);
      doc.setTextColor(0,0,0);
    }
    doc.save(`Presupuesto_${p.cliente || 'cliente'}_${p.fecha ? p.fecha.toString().slice(0, 10) : ''}.pdf`);
  }

  constructor(
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.productoService.mostrarProductos().subscribe(data => this.productos = data);
    this.auth.isLoggedIn().subscribe(isLogged => {
      if (isLogged) {
        this.cargarHistorial();
      }
    });
  }

  agregarItem() {
    this.presupuestoItems.push({ producto_id: 0, nombre: '', cantidad: 1, precio_unitario: 0 });
  }

  eliminarItem(i: number) {
    this.presupuestoItems.splice(i, 1);
  }

  actualizarProducto(i: number) {
    const item = this.presupuestoItems[i];
    const prod = this.productos.find((p: any) => p.id == item.producto_id);
    if (prod) {
      item.nombre = prod.nombre;
      item.precio_unitario = prod.precioVenta || prod.precio_venta || prod.precioventa || 0;
    }
  }

  calcularTotal() {
    return this.presupuestoItems.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
  }

  guardarPresupuesto() {
    if (!this.cliente || this.presupuestoItems.length === 0) {
      this.mensaje = 'Completa el cliente y al menos un producto';
      return;
    }
    const usuario = this.auth.getUser();
    if (!usuario || !usuario.id) {
      this.mensaje = 'Usuario no identificado';
      return;
    }
    const presupuesto: any = {
      cliente: this.cliente,
      fecha: new Date().toISOString().slice(0, 10),
      items: this.presupuestoItems,
      total: this.calcularTotal(),
      usuario_id: usuario.id
    };
    this.presupuestoService.guardarPresupuesto(presupuesto).subscribe(() => {
      this.mensaje = 'Presupuesto guardado';
      this.presupuestoItems = [];
      this.cliente = '';
      this.cargarHistorial();
    });
  }

  get historialFiltrado() {
    let filtrados = this.historial;
    if (this.filtroCliente.trim()) {
      filtrados = filtrados.filter(p => p.cliente?.toLowerCase().includes(this.filtroCliente.trim().toLowerCase()));
    }
    return filtrados;
  }

  get totalPaginas() {
    return Math.ceil(this.historialFiltrado.length / this.presupuestosPorPagina) || 1;
  }

  get historialPagina() {
    const inicio = (this.paginaActual - 1) * this.presupuestosPorPagina;
    return this.historialFiltrado.slice(inicio, inicio + this.presupuestosPorPagina);
  }

  cambiarPagina(delta: number) {
    this.paginaActual += delta;
    if (this.paginaActual < 1) this.paginaActual = 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
  }

  cargarHistorial() {
    this.presupuestoService.obtenerPresupuestos().subscribe(data => {
      this.historial = data;
      this.paginaActual = 1;
    });
  }
}
