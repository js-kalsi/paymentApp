import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { apiURL } from '../consts';
import { Utils } from '../utils';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private _http: HttpClient, private _utils: Utils) {
  }

  searchRecord = (payload: any) => {
    let params = new HttpParams();
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {  // Ensure the key belongs to the object itself
        params = params.set(key, payload[key]);
      }
    }

    return this._http.get<any>(`${apiURL}/get_payments`, { params })
      .pipe(catchError(this._utils.handleError));
  };

  updateRecord = (record: any): Observable<any> => {
    return this._http.put<any>(`${apiURL}/update_payment/${record._id}`, record).pipe(catchError(this._utils.handleError));
  };

  rmRecord = (payId: string): Observable<any> => {
    return this._http.delete(`${apiURL}/delete_payment/${payId}`);
  };

  addRecord = (record: any): Observable<any> => {
    return this._http.post<any>(`${apiURL}/add_payment`, record).pipe(catchError(this._utils.handleError));
  };


}
