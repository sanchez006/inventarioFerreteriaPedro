
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.css'],
  // providers eliminado para usar el interceptor global
})
export class ReporteVentasComponent implements OnInit {
  ventas: any[] = [];
  ventasFiltradas: any[] = [];
  desde = '';
  hasta = '';
  mesSeleccionado: string = '';
  paginaActual: number = 1;
  tamanoPagina: number = 15;
  totalPaginas: number = 1;
  consultado = false;
  detalleVenta: any[] | null = null;
  detalleCargando = false;
  detalleIndex: number | null = null;
  totalGeneral = 0;
  filtroProducto = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
    const rows = this.ventasFiltradas.map(v => [
      v.id,
      new Date(v.fecha).toLocaleString(),
      v.usuario || '—',
      `$${v.total_venta}`
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      theme: 'grid',
      margin: { top: 20 },
      headStyles: { fillColor: [22, 160, 133] },
      foot: [['', '', 'Total general', `$${this.totalGeneral}`]],
    });
    doc.save('reporte_ventas.pdf');
  }

  consultar() {
    this.consultado = true;
    this.http.get<any[]>(`http://localhost:3001/reporte/ventas?desde=${this.desde}&hasta=${this.hasta}`).subscribe({
      next: (data) => {
        this.ventas = data;
        this.aplicarFiltro();
      },
      error: () => {
        this.ventas = [];
        this.ventasFiltradas = [];
        this.totalGeneral = 0;
      }
    });
    this.detalleVenta = null;
    this.detalleIndex = null;
  }

  aplicarFiltro() {
    if (!this.filtroProducto) {
      this.ventasFiltradas = [...this.ventas];
    } else {
      this.ventasFiltradas = this.ventas.filter(v =>
        v.detalle && v.detalle.some(d => d.producto.toLowerCase().includes(this.filtroProducto.toLowerCase()))
      );
    }
    this.totalGeneral = this.ventasFiltradas.reduce((acc, v) => acc + (+v.total_venta), 0);
    this.totalPaginas = Math.ceil(this.ventasFiltradas.length / this.tamanoPagina) || 1;
    this.paginaActual = 1;
  }

  get ventasPagina() {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.ventasFiltradas.slice(inicio, inicio + this.tamanoPagina);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
  }

  verDetalle(venta: any, i: number) {
    if (this.detalleIndex === i) {
      this.detalleIndex = null;
      this.detalleVenta = null;
      return;
    }
    this.detalleCargando = true;
    this.detalleIndex = i;
    this.http.get<any[]>(`http://localhost:3001/ventas/${venta.id}/detalle`).subscribe({
      next: (data) => {
        this.detalleVenta = data;
        this.detalleCargando = false;
      },
      error: () => {
        this.detalleVenta = [];
        this.detalleCargando = false;
      }
    });
  }
}
