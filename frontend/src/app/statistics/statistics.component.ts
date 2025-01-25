import {Component, OnInit} from '@angular/core';
import {Utils} from '../utils';
import {RecordsService} from '../services/record.service';
import {ReloadStatisticsService} from '../services/reload-statistics-service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  statistics_today = {
    'total_bovine': null,
    'sum_wt_bovine': null,
    'avg_wt_bovine': null,
    'max_weight': null,
    'max_wt_owner': null,
    'total_head': null,
  }
  statistics_total = {
    'total_bovine': null,
    'sum_wt_bovine': null,
    'avg_wt_bovine': null,
    'max_weight': null,
    'max_wt_owner': null,
    'total_head': null,
  }

  constructor(protected _utils: Utils,
              private _recordsService: RecordsService,
              private _reloadStatisticsService: ReloadStatisticsService) {
  }

  ngOnInit() {
    this.get_statistics();
    this._reloadStatisticsService.change$.subscribe((value) => {
      console.log("I am inside parent component :>", value)
      if (value) {
        this.get_statistics();
      }
    });
  }

  get_statistics = () => {
    console.log("get_statistics() is called!")
    const {start, end} = this._utils.getUTCRangeByDate();
    this._recordsService.get_statistics(start, end).subscribe({
      next: (response) => {
        console.log(response)
        if (!response.success) console.log("Error occurred while calling get_statistics api!");
        this.statistics_today = response.result.today;
        this.statistics_total = response.result.total;
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => console.log("Fetching Max Lot complete"),
    });
  };


}
