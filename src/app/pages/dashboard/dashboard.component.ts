
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { DashboardService } from '../../core/services/dashboard.service';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgChartsModule, SharedModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  ventasChartData: any = { labels: [], datasets: [] };
  comprasChartData: any = { labels: [], datasets: [] };
  masVendidosChartData: any = { labels: [], datasets: [] };
  stockBajoChartData: any = { labels: [], datasets: [] };

  constructor(private router: Router, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarVentas();
    this.cargarCompras();
    this.cargarMasVendidos();
    this.cargarStockBajo();
  }

  go(path: string) {
    this.router.navigate([path]);
  }

  cargarVentas() {
    this.dashboardService.ventasPorMes().subscribe((data: any) => {
      this.ventasChartData = {
        labels: data.labels,
        datasets: [
          { label: 'Ventas', data: data.values, backgroundColor: '#1976d2' }
        ]
      };
    });
  }

  cargarCompras() {
    this.dashboardService.comprasPorMes().subscribe((data: any) => {
      this.comprasChartData = {
        labels: data.labels,
        datasets: [
          { label: 'Compras', data: data.values, backgroundColor: '#388e3c' }
        ]
      };
    });
  }

  cargarMasVendidos() {
    this.dashboardService.productosMasVendidos().subscribe((data: any) => {
      this.masVendidosChartData = {
        labels: data.labels,
        datasets: [
          { label: 'Más vendidos', data: data.values, backgroundColor: ['#ffa726', '#29b6f6', '#66bb6a', '#ef5350', '#ab47bc'] }
        ]
      };
    });
  }

  cargarStockBajo() {
    this.dashboardService.stockBajo().subscribe((data: any[]) => {
      this.stockBajoChartData = {
        labels: data.map(p => p.nombre),
        datasets: [
          { label: 'Stock bajo', data: data.map(p => p.cantidad), backgroundColor: '#b22222' }
        ]
      };
    });
  }
}
