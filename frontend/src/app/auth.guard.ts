import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private _router: Router) {
  }

  canActivate(): boolean {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      this._router.navigate(['/login']).then(r => {
        console.log('Redirected to /login', r);
      });
      return false;
    }

    try {
      // Decode the token and check for expiration
      const decodedToken: any = (token);

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        // Token has expired
        alert('Session expired. Please log in again.');
        localStorage.removeItem('auth_token');
        this._router.navigate(['/login']).then(r => {
          console.log('Redirected to /login', r);
        });
        return false;
      }
    } catch (error) {
      // Invalid token format
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('auth_token');
      console.log('Redirected to /login', error);
      return false;
    }

    return true;
  }
}
