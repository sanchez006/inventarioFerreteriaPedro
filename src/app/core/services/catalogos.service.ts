import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private categoriasUrl = 'http://localhost:3001/categorias';
  private proveedoresUrl = 'http://localhost:3001/proveedores';

  constructor(private http: HttpClient) {}

  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>(this.categoriasUrl);
  }

  obtenerProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.proveedoresUrl);
  }
}
