import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared.module';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-alertas-stock',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './alertas-stock.component.html',
  styleUrls: ['./alertas-stock.component.css'],
  // providers eliminado para usar el interceptor global
})
export class AlertasStockComponent implements OnInit {
  productosBajoStock: any[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    this.auth.isLoggedIn().subscribe(isLogged => {
      if (isLogged) {
        this.http.get<any[]>('https://inventarioferreteriapedro.onrender.com/alertas/stock-bajo').subscribe({
          next: (data) => {
            this.productosBajoStock = data;
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al cargar alertas de stock bajo';
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
        this.error = 'Debe iniciar sesión para ver las alertas de stock bajo';
      }
    });
  }
}
