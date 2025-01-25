import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ReloadStatisticsService {
  private changeSubject = new Subject<boolean>();
  change$ = this.changeSubject.asObservable();

  notifyChange(reloadStatics: boolean) {
    console.log('reloadStatics', reloadStatics)
    this.changeSubject.next(reloadStatics);
  }
}
