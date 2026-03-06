import { AuthService } from '../../core/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Proveedor, ProveedorService } from '../../core/services/proveedor.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-proveedores.component.html',
  styleUrls: ['./lista-proveedores.component.css']
})
export class ListaProveedoresComponent implements OnInit {
    role: string = '';
  proveedores: Proveedor[] = [];
  proveedorNuevo: Proveedor = { nombre: '', contacto: '', telefono: '', direccion: '' };
  proveedorEditando: Proveedor | null = null;
  mensaje = '';

  constructor(private proveedorService: ProveedorService, private auth: AuthService) {
    this.role = this.auth.getRole();
  }

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.proveedorService.getProveedores().subscribe(data => this.proveedores = data);
  }

  guardarProveedor() {
    if (this.proveedorEditando) {
      this.proveedorService.editarProveedor(this.proveedorEditando.id!, this.proveedorEditando).subscribe(() => {
        this.mensaje = 'Proveedor actualizado';
        this.proveedorEditando = null;
        this.cargarProveedores();
      });
    } else {
      this.proveedorService.crearProveedor(this.proveedorNuevo).subscribe(() => {
        this.mensaje = 'Proveedor agregado';
        this.proveedorNuevo = { nombre: '', contacto: '', telefono: '', direccion: '' };
        this.cargarProveedores();
      });
    }
  }

  editarProveedor(p: Proveedor) {
    this.proveedorEditando = { ...p };
    this.mensaje = '';
  }

  cancelarEdicion() {
    this.proveedorEditando = null;
  }

  eliminarProveedor(id: number) {
    if (confirm('¿Eliminar proveedor?')) {
      this.proveedorService.eliminarProveedor(id).subscribe(() => {
        this.mensaje = 'Proveedor eliminado';
        this.cargarProveedores();
      });
    }
  }
}
