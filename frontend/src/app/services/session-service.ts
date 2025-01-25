import {Injectable} from '@angular/core';
import {CookieService} from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private _cookieService: CookieService) {
  }

  setBase = (base: string): void => this._cookieService.set('base', base || '0');

  getBase = (): string => this._cookieService.get('base') || '0';

  resetBase = (): void => this._cookieService.delete('base');

  // Mode can be either office or entry
  setMode = (mode: string): void => this._cookieService.set('mode', mode);

  getMode = (): string => this._cookieService.get('mode');

  resetMode = (): void => this._cookieService.delete('mode');
}

