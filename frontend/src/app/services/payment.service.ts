import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { apiURL } from '../consts';
import { Utils } from '../utils';


@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private _http: HttpClient, private _utils: Utils) {
  }

  getDataByBilledNo = (billedNo: string): Observable<any> => {
    const params = new HttpParams().set('billed_no', billedNo);
    return this._http.get<any>(`${apiURL}/api/payment/generate-summary-by-billed-no`, { params })
      .pipe(catchError(this._utils.handleError));
  };

  removeDataByBilledNo = (billedNo: string): Observable<any> => {
    const params = new HttpParams().set('billed_no', billedNo);
    return this._http.delete<any>(`${apiURL}/api/payment/delete-billed-record`, { params })
      .pipe(catchError(this._utils.handleError));
  };

  getPayRecords = (data: any) => {
    const params = new HttpParams()
      .set('lot', data.lot)
      .set('destination', data.destination)
      .set('owner', data.owner)
      .set('kill_date_from', data.kill_date_from)
      .set('kill_date_to', data.kill_date_to);
    return this._http.get<any>(`${apiURL}/api/payment/get-records`, { params })
      .pipe(catchError(this._utils.handleError));
  };

  addToBilling = (payload: any): Observable<any> => {
    console.log("payload :>", payload)
    return this._http.post(`${apiURL}/api/payment/add-to-billing`, payload).pipe(catchError(this._utils.handleError));
  };
}
