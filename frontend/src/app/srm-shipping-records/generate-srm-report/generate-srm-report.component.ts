import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {Utils} from '../../utils';
import {SrmShippingService} from '../../services/srm-shipping-service';
import {apiURL} from '../../consts';

@Component({
  selector: 'app-srm-shipping-records',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './generate-srm-report.component.html',
  styleUrl: './generate-srm-report.component.css'
})
export class GenerateSrmReportComponent implements OnInit {

  srm = {'startDate': '', 'endDate': ''}
  enableLoader: boolean = false;
  report_url: string = '';

  constructor(private _utils: Utils, private _srmShippingService: SrmShippingService) {
  }

  ngOnInit(): void {
    const today = new Date();
    this.srm.startDate = today.toISOString().split('T')[0];
    this.srm.endDate = today.toISOString().split('T')[0];
  }

  generateReport = () => {
    this.enableLoader = true;
    const dates = {
      startDate: this._utils.localToUnixTimestamp(this.srm.startDate),
      endDate: this._utils.localToUnixTimestamp(this.srm.endDate)
    }
    console.log("Dates :>", dates)

    this._srmShippingService.generateSRMReport(dates).subscribe({
      next: (response) => {
        if (response.success) {
          this.enableLoader = false;
          this.report_url = `${apiURL}/${response.file_path}`;
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  }

  resetData = () => {
    this.enableLoader = false;
    this.report_url = '';
  };

}
