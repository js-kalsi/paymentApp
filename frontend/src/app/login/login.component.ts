import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NgForOf, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {AuthService} from '../services/auth-service.service';
import {SessionService} from '../services/session-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    NgOptimizedImage,
  ],
  providers: [AuthService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  userNames: string [] = [];
  userName: string = 'desk';
  password: string = '';

  constructor(private _router: Router,
              private _authService: AuthService,
              private _sessionService: SessionService) {
  }

  getAllUsers = () => {
    this._authService.getAllUsers().subscribe({
      next: (response) => {
        this.userNames = response;
        console.log(this.userNames);
      },
      error: (error) => {
        console.error('Error occurred:', error);
      },
      complete: () => {
        console.log('Users fetching complete');
      },
    });
  }


  ngOnInit() {
    this.getAllUsers();
  }

  onLogin() {
    this._sessionService.resetBase();
    this._authService.login(this.userName, this.password);

    // this._router.navigate(['/entry-mode']).then(r =>
    //   console.log("Redirected to entry-mode", r)
    // );
  }

}
