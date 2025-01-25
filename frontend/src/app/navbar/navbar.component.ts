import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {AuthService} from '../services/auth-service.service';
import {SessionService} from '../services/session-service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    RouterLinkActive
  ],
  providers: [AuthService, SessionService],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  mode: string = '';

  constructor(private _authService: AuthService, private _sessionService: SessionService) {
  }

  ngOnInit() {
    this.detectMode();
  }

  updateMode = (modeType: string) => {
    this._sessionService.setMode(modeType);
    this.mode = this._sessionService.getMode();
  };

  detectMode = () => {
    this.mode = this._sessionService.getMode();
  };

  logout = () => {
    this._sessionService.resetBase();
    this._sessionService.resetMode();
    this._authService.logout();
  };
}
