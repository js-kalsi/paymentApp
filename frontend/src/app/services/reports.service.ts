import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { apiURL } from '../consts';
import { Utils } from '../utils';

@Injectable({
    providedIn: 'root'
})
export class ReportService {

    constructor(private _http: HttpClient, private _utils: Utils) {
    }

    generateDayReport = (date: number): Observable<any> => {
        const params = new HttpParams().set('date', date);
        return this._http.get<any>(`${apiURL}/api/report/day-report`, { params }).pipe(catchError(this._utils.handleError));
    };

    generateTagReport = (payload: { from: number, to: number }): Observable<any> => {
        const params = new HttpParams().set('from', payload.from).set('to', payload.to);
        return this._http.get<any>(`${apiURL}/api/report/tag-report`, { params }).pipe(catchError(this._utils.handleError));
    };
}

