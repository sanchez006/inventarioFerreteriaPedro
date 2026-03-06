import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared.module';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../../core/auth.interceptor';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css'],
  // providers eliminado para usar el interceptor global
})
export class MovimientosComponent implements OnInit {

  movimientos: any[] = [];
  movimientosFiltrados: any[] = [];
  filtro: string = '';
  desde: string = '';
  hasta: string = '';
  mesSeleccionado: string = '';
  paginaActual: number = 1;
  tamanoPagina: number = 15;
  totalPaginas: number = 1;
  mensaje: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const hoy = new Date();
    // Mes actual en formato yyyy-MM
    this.mesSeleccionado = hoy.toISOString().substring(0, 7);
    this.setFechasPorMes(this.mesSeleccionado);
    this.cargarMovimientos();

  }

  setFechasPorMes(mes: string) {
    // mes: yyyy-MM
    const [anio, mesNum] = mes.split('-').map(Number);
    const desde = new Date(anio, mesNum - 1, 1);
    const hasta = new Date(anio, mesNum, 0); // último día del mes
    this.desde = desde.toISOString().substring(0, 10);
    this.hasta = hasta.toISOString().substring(0, 10);
  }

  cambiarMes() {
    if (this.mesSeleccionado) {
      this.setFechasPorMes(this.mesSeleccionado);
      this.cargarMovimientos();
    }
  }

  cargarMovimientos() {
    this.http.get<any[]>(`https://inventarioferreteriapedro.onrender.com/movimientos?desde=${this.desde}&hasta=${this.hasta}`).subscribe({
      next: (data) => {
        this.movimientos = data;
        this.aplicarFiltro();
      },
      error: () => {
        this.movimientos = [];
        this.movimientosFiltrados = [];
        this.mensaje = 'Error al cargar movimientos';
      }
    });
  }

  aplicarFiltro() {
    let filtrados = this.movimientos;
    if (this.filtro.trim()) {
      const f = this.filtro.trim().toLowerCase();
      filtrados = filtrados.filter(m =>
        (m.producto && m.producto.toLowerCase().includes(f)) ||
        (m.usuario && m.usuario.toLowerCase().includes(f)) ||
        (m.tipo && m.tipo.toLowerCase().includes(f))
      );
    }
    this.movimientosFiltrados = filtrados.filter(m => {
      const fecha = m.fecha ? m.fecha.substring(0, 10) : '';
      return (!this.desde || fecha >= this.desde) && (!this.hasta || fecha <= this.hasta);
    });
    this.totalPaginas = Math.ceil(this.movimientosFiltrados.length / this.tamanoPagina) || 1;
    this.paginaActual = 1;
  }

  get movimientosPagina() {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.movimientosFiltrados.slice(inicio, inicio + this.tamanoPagina);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
  }

  buscar() {
    this.aplicarFiltro();
  }
}
