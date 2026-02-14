import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../../core/services/producto.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-lista-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-producto.component.html',
  styleUrl: './lista-producto.component.css'
})

export class ListaProductoComponent implements OnInit {

  productos: any[]=[];

  constructor(private productoServicio: ProductoService ){} //importamos el servicio

  ngOnInit():void{  //funcion que se usa para cargar datos desde una API (lo usamos para hacer peticiones)
    this.productoServicio.mostrarProductos().subscribe((data: any[]) =>{
     this.productos=data
    });
  }

}
