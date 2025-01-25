import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { apiURL } from '../consts';
import { Utils } from '../utils';
import { EntryModeRecord } from '../interfaces/entryModeServiceInterface';
import { recordInterface, searchRecordInterface } from '../interfaces/recordInterface';


@Injectable({
  providedIn: 'root'
})
export class RecordsService {

  constructor(private _http: HttpClient, private _utils: Utils) {
  }

  getDataFromEntries = (): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/record/get-data-from-entries`).pipe(catchError(this._utils.handleError));
  };


  saveRecord = (record: EntryModeRecord): Observable<any> => {
    return this._http.post(`${apiURL}/api/record/create`, record).pipe(catchError(this._utils.handleError));
  };

  getAllOwners = (): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/record/get-owners`).pipe(catchError(this._utils.handleError));
  };

  updateRecord = (record: recordInterface): Observable<any> => {
    return this._http.post<any>(`${apiURL}/api/record/update`, record).pipe(catchError(this._utils.handleError));
  };

  rmRecord = (id: number): Observable<any> => {
    return this._http.delete(`${apiURL}/api/record/delete`, { params: { id: id.toString() } });
  }


  getTodayProject = (start: number, end: number): Observable<any> => {
    const params = new HttpParams().set('start', start).set('end', end);
    return this._http.get<any>(`${apiURL}/api/record/get`, { params }).pipe(catchError(this._utils.handleError));
  };


  get_statistics = (start: number, end: number): Observable<any> => {
    const params = new HttpParams().set('start', start).set('end', end);
    return this._http.get<any>(`${apiURL}/api/record/get-statistics`, { params }).pipe(catchError(this._utils.handleError));
  };

  searchRecord = (record: searchRecordInterface): Observable<any> => {
    const params = new HttpParams()
      .set('eartag', record['eartag'])
      .set('rfid', record['rfid'])
      .set('kill_date_from', record['kill_date_from'])
      .set('kill_date_to', record['kill_date_to'])
      .set('lot', record['lot'])
      .set('owner', record['owner'])
      .set('bill_to', record['bill_to'])
      .set('otm', record['otm'])

    return this._http.get<any>(`${apiURL}/api/record/search`, { params }).pipe(catchError(this._utils.handleError));
  };

  checkIFRFIDExist = (rfid: string): Observable<any> => {
    const params = new HttpParams().set('rfid', rfid);
    return this._http.get<any>(`${apiURL}/api/record/rfid`, { params });
  };


}
