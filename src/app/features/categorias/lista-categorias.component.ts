import { AuthService } from '../../core/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { CategoriasService, Categoria } from '../../core/services/categorias.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-categorias.component.html',
  styleUrls: ['./lista-categorias.component.css']
})
export class ListaCategoriasComponent implements OnInit {
    role: string = '';
  categorias: Categoria[] = [];
  categoriaNueva: Categoria = { nombre: '' };
  categoriaEditando: Categoria | null = null;
  mensaje = '';

  constructor(private categoriasService: CategoriasService, private auth: AuthService) {
    this.role = this.auth.getRole();
  }

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.categoriasService.getCategorias().subscribe(data => this.categorias = data);
  }

  guardarCategoria() {
    if (this.categoriaEditando) {
      this.categoriasService.editarCategoria(this.categoriaEditando.id!, this.categoriaEditando).subscribe(() => {
        this.mensaje = 'Categoría actualizada';
        this.categoriaEditando = null;
        this.cargarCategorias();
      });
    } else {
      this.categoriasService.crearCategoria(this.categoriaNueva).subscribe(() => {
        this.mensaje = 'Categoría agregada';
        this.categoriaNueva = { nombre: '' };
        this.cargarCategorias();
      });
    }
  }

  editarCategoria(c: Categoria) {
    this.categoriaEditando = { ...c };
    this.mensaje = '';
  }

  cancelarEdicion() {
    this.categoriaEditando = null;
  }

  eliminarCategoria(id: number) {
    if (confirm('¿Eliminar categoría?')) {
      this.categoriasService.eliminarCategoria(id).subscribe(() => {
        this.mensaje = 'Categoría eliminada';
        this.cargarCategorias();
      });
    }
  }
}
