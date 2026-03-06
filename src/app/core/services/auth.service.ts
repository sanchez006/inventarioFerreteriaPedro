import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
    getRole(): string {
      const user = this.getUser();
      return user && user.rol ? user.rol : '';
    }
  private apiUrl = 'https://inventarioferreteriapedro.onrender.com';
  private tokenKey = 'token';
  private userKey = 'user';
  private loggedIn = new BehaviorSubject<boolean>(this.hasValidToken());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.loggedIn.next(true);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.loggedIn.next(false);
  }

  isLoggedIn(): Observable<boolean> {
    // Cada vez que se suscriba, verifica el token
    this.loggedIn.next(this.hasValidToken());
    return this.loggedIn.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;
    try {
      // Decodificar el payload del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Revisar expiración (exp en segundos)
      if (!payload.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      return false;
    }
  }
  // Llamar esto después de cualquier acción que pueda cambiar el token
  refreshLoginStatus() {
    this.loggedIn.next(this.hasValidToken());
  }
}
