import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './menu-principal.component.html',
  styleUrls: ['./menu-principal.component.css']
})
export class MenuPrincipalComponent {
  constructor(private auth: AuthService, private router: Router) {}

  get isAdmin(): boolean {
    return this.auth.getRole() === 'admin';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
