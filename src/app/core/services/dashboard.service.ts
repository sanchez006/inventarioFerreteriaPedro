import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = 'https://inventarioferreteriapedro.onrender.com';

  constructor(private http: HttpClient) {}

  ventasPorMes(): Observable<any> {
    return this.http.get(`${this.api}/dashboard/ventas-mes`);
  }

  comprasPorMes(): Observable<any> {
    return this.http.get(`${this.api}/dashboard/compras-mes`);
  }

  productosMasVendidos(): Observable<any> {
    return this.http.get(`${this.api}/dashboard/mas-vendidos`);
  }

  stockBajo(): Observable<any> {
    return this.http.get(`${this.api}/alertas/stock-bajo`);
  }
}
