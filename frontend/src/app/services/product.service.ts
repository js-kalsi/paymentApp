import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {apiURL} from '../consts';
import {Utils} from '../utils';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private _http: HttpClient, private _utils: Utils) {
  }

  getProducts = (): Observable<any> => {
    return this._http.get<any>(`${apiURL}/api/products`).pipe(catchError(this._utils.handleError));
  };


  updateProduct = (product: { [key: number]: number }): Observable<any> => {
    return this._http.put<any>(`${apiURL}/api/product/update`, product).pipe(catchError(this._utils.handleError));
  };
}
