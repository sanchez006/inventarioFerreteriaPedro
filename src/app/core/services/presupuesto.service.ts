import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PresupuestoItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Presupuesto {
  id?: number;
  cliente?: string;
  fecha: string;
  items: PresupuestoItem[];
  total: number;
  usuario?: string;
  usuario_id?: number;
}

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private apiUrl = 'http://localhost:3001/presupuestos';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  guardarPresupuesto(presupuesto: Presupuesto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl, presupuesto, headers ? { headers } : {});
  }

  obtenerPresupuestos(): Observable<Presupuesto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Presupuesto[]>(this.apiUrl, headers ? { headers } : {});
  }
}
