import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Utils } from '../utils';
import { apiURL } from '../consts';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  // private apiUrl = `{apiURL}/login`;

  constructor(private _http: HttpClient, private _router: Router, private _utils: Utils) {
  }


  getAllUsers = (): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/users/get`).pipe(catchError(this._utils.handleError));
  };


  login = (username: string, password: string): void => {
    const hashedPassword = CryptoJS.MD5(password).toString();
    this._http.post<any>(`${apiURL}/api/login`, { username: username, password: hashedPassword })
      .pipe(catchError(this.handleError))
      .subscribe(response => {
        if (response.success) {
          localStorage.setItem('auth_token', response.token);  // Storing JWT token
          localStorage.setItem('role', response.role);
          this._router.navigateByUrl('/entry-mode').then(r =>
            console.log("Redirected to entry-mode", r)
          );
        } else {
          alert('Login failed. Please check your credentials.');
        }
      });
  };


  logout = (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('role');
    this._router.navigateByUrl('/login').then(r =>
      console.log("Redirected to logout", r)
    );
  };

  isAuthenticated = (): boolean => {
    const token = localStorage.getItem('auth_token');
    // Optionally decode the token here to check for expiration
    return !!token;
  };

  handleError = (error: HttpErrorResponse) => {
    console.log("Error: ", error);
    if (error.status === 401) {
      // Handle invalid token case
      alert('Invalid Username or Password!');
      this.logout();  // Log out the user
    }

    return throwError(() => new Error('Something went wrong. Please try again.'));
  };

  getRole = (): string | null => {
    return localStorage.getItem('role');
  };
}
