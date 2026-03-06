import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroProductos',
  standalone: true
})
export class FiltroProductosPipe implements PipeTransform {
  transform(productos: any[], filtro: string): any[] {
    if (!filtro) return productos;
    const f = filtro.toLowerCase();
    return productos.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(f)) ||
      (p.categoria && p.categoria.toLowerCase().includes(f)) ||
      (p.proveedor && p.proveedor.toLowerCase().includes(f))
    );
  }
}