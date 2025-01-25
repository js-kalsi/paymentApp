import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {apiURL} from '../consts';
import {Utils} from '../utils';

@Injectable({
  providedIn: 'root'
})

export class SrmShippingService {
  constructor(private _http: HttpClient, private _utils: Utils) {
  }

  saveSRMShippingRecord = (record: { date: number, weight: number }): Observable<any> => {
    console.log("Inside service :", record)
    return this._http.post<any>(`${apiURL}/api/srm/create`, record).pipe(catchError(this._utils.handleError));
  };

  getSrmShippingRecordByCurrentYear = (): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/srm/get`).pipe(catchError(this._utils.handleError));
  };

  rmRecordById = (id: number): Observable<any> => {
    return this._http.delete(`${apiURL}/api/srm/delete`, {params: {id: id.toString()}});
  }

  generateSRMReport = (dates: { startDate: number, endDate: number }): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/srm/generate-report`, {params: dates}).pipe(catchError(this._utils.handleError));
  };


}


