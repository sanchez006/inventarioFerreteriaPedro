import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

//interfaz de la tabla de productos en la base de datos
export interface Producto{
  nombre:string,
  descripcion:string,
  precioCompra:number,
  precioVenta:number,
  cantidad:number,
  categoriaid:number,
  proveedorid:number,
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiURL = 'https://inventarioferreteriapedro.onrender.com/productos';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  mostrarProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  agregarProducto(producto: Producto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiURL, producto, headers ? { headers } : {});
  }

  actualizarProducto(id: number, producto: Producto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiURL}/${id}`, producto, headers ? { headers } : {});
  }

  eliminarProducto(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiURL}/${id}`, headers ? { headers } : {});
  }
}
