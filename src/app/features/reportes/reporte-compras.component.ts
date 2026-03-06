
import { Component } from '@angular/core';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-reporte-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './reporte-compras.component.html',
  styleUrls: ['./reporte-compras.component.css'],
  // providers eliminado para usar el interceptor global
})
export class ReporteComprasComponent {
  compras: any[] = [];
  comprasFiltradas: any[] = [];
  desde = '';
  hasta = '';
  mesSeleccionado: string = '';
  paginaActual: number = 1;
  tamanoPagina: number = 15;
  totalPaginas: number = 1;
  consultado = false;
  detalleCompra: any[] | null = null;
  detalleCargando = false;
  detalleIndex: number | null = null;
  totalGeneral = 0;
  filtroProducto = '';

  constructor(private http: HttpClient) {
    const hoy = new Date();
    this.mesSeleccionado = hoy.toISOString().substring(0, 7);
    this.setFechasPorMes(this.mesSeleccionado);
    this.consultar();
  }

  setFechasPorMes(mes: string) {
    const [anio, mesNum] = mes.split('-').map(Number);
    const desde = new Date(anio, mesNum - 1, 1);
    const hasta = new Date(anio, mesNum, 0);
    this.desde = desde.toISOString().substring(0, 10);
    this.hasta = hasta.toISOString().substring(0, 10);
  }

  cambiarMes() {
    if (this.mesSeleccionado) {
      this.setFechasPorMes(this.mesSeleccionado);
      this.consultar();
    }
  }

  exportarPDF() {
    const doc = new jsPDF();
    const columns = ['ID', 'Fecha', 'Usuario', 'Total'];
    const rows = this.comprasFiltradas.map(c => [
      c.id,
      new Date(c.fecha).toLocaleString(),
      c.usuario || '—',
      `$${c.total_compra}`
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      theme: 'grid',
      margin: { top: 20 },
      headStyles: { fillColor: [22, 160, 133] },
      foot: [['', '', 'Total general', `$${this.totalGeneral}`]],
    });
    doc.save('reporte_compras.pdf');
  }

  consultar() {
    this.consultado = true;
    this.http.get<any[]>(`http://localhost:3001/reporte/compras?desde=${this.desde}&hasta=${this.hasta}`).subscribe({
      next: (data) => {
        this.compras = data;
        this.aplicarFiltro();
      },
      error: () => {
        this.compras = [];
        this.comprasFiltradas = [];
        this.totalGeneral = 0;
      }
    });
    this.detalleCompra = null;
    this.detalleIndex = null;
  }

  aplicarFiltro() {
    if (!this.filtroProducto) {
      this.comprasFiltradas = [...this.compras];
    } else {
      this.comprasFiltradas = this.compras.filter(c =>
        c.detalle && c.detalle.some(d => d.producto.toLowerCase().includes(this.filtroProducto.toLowerCase()))
      );
    }
    this.totalGeneral = this.comprasFiltradas.reduce((acc, c) => acc + (+c.total_compra), 0);
    this.totalPaginas = Math.ceil(this.comprasFiltradas.length / this.tamanoPagina) || 1;
    this.paginaActual = 1;
  }

  get comprasPagina() {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.comprasFiltradas.slice(inicio, inicio + this.tamanoPagina);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
  }

  verDetalle(compra: any, i: number) {
    if (this.detalleIndex === i) {
      this.detalleIndex = null;
      this.detalleCompra = null;
      return;
    }
    this.detalleCargando = true;
    this.detalleIndex = i;
    this.http.get<any[]>(`http://localhost:3001/compras/${compra.id}/detalle`).subscribe({
      next: (data) => {
        this.detalleCompra = data;
        this.detalleCargando = false;
      },
      error: () => {
        this.detalleCompra = [];
        this.detalleCargando = false;
      }
    });
  }
}
