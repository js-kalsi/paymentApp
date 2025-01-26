import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LocationService {
    private baseUrl = 'https://countriesnow.space/api/v0.1';

    constructor(private http: HttpClient) { }

    getCountries(): Observable<any> {
        return this.http.get(`${this.baseUrl}/countries/iso`);
    }

    getStates(country: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/countries/states`, { iso2: country });
    }

    getCities(country: string, state: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/countries/cities`, { iso2: country, state: state });
    }

    getCurrencies(country: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/countries/currency`, { iso2: country });
    }
}
