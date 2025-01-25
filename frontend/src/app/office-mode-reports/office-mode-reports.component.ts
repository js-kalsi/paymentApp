import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { NgForOf, NgIf } from '@angular/common';
import { Utils } from '../utils';
import { ReportService, SrmShippingService } from '../services';
import { apiURL } from '../consts';

@Component({
  selector: 'app-office-mode-reports',
  standalone: true,
  imports: [FormsModule, NgForOf, NgIf],
  providers: [SrmShippingService,],
  templateUrl: './office-mode-reports.component.html',
  styleUrl: './office-mode-reports.component.css'
})
export class OfficeModeReportsComponent implements OnInit {
  dayReports: any = { date: "", records: [], srmWeight: "", mode: true, srmWtExistInDB: false };
  retiredTagReports = { fromDate: "", toDate: "", records: [], url: `${apiURL}/public/reports/dailyrtreport.csv`, url_bovine: `${apiURL}/public/reports/dailyrtreport_bovine.csv`, mode: false };
  enableLoader: boolean = false;
  private route = inject(ActivatedRoute);

  constructor(protected _utils: Utils,
    private _reportService: ReportService,
    private _route: ActivatedRoute,
    private _srmShippingService: SrmShippingService) { }


  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const reportType = params['type'];
      if (reportType === 'day-report') {
        this.dayReports.mode = true;
        this.retiredTagReports.mode = false;
        this.dayReports.date = this._utils.getTodaysDate();
        this.generateDayReport();
      }
      else if (reportType === 'tag-report') {
        this.dayReports.mode = false;
        this.retiredTagReports.mode = true;
        const dates = this._utils.getCurrentAndFutureDate()
        this.retiredTagReports.fromDate = dates.currentDate;
        this.retiredTagReports.toDate = dates.futureDate;
        this.generateTagReport();
      }
    });
  }

  // Pagination related functionality
  currentPage = 1;
  @Input() recordsPerPage: number = 10;


  get paginatedItems() {
    const start = (this.currentPage - 1) * this.recordsPerPage;
    return this.dayReports.records.slice(start, start + this.recordsPerPage);
  }


  generateDayReport = () => {
    const timestamp = this._utils.localToUnixTimestamp(this.dayReports.date);
    this.enableLoader = true;
    this.dayReports.srmWtExistInDB = false;
    this._reportService.generateDayReport(timestamp).subscribe({
      next: (response) => {
        if (response.success) {

          if (response.message === "No SRM Weight found!") this.dayReports.srmWtExistInDB = false;
          else if (response.message === "SRM Weight found!") this.dayReports.srmWtExistInDB = true;
          this.dayReports.records = response.result.entries;
          this.dayReports.srmWeight = response.result.srm_wt;
          this.dayReports.url = `${apiURL}/public/reports/dailyreport.csv`
        }
      },
      error: (error) => {
        this.dayReports.srmWtExistInDB = false;
      },
      complete: () => {
        this.enableLoader = false;
      },
    });
  };


  saveSrmEodWeight() {
    const record = {
      date: this._utils.localToUnixTimestamp(this.dayReports.date),
      weight: Number(this.dayReports.srmWeight)
    }
    this._srmShippingService.saveSRMShippingRecord(record).subscribe({
      next: (response) => {
        if (response.success) {
          this.generateDayReport();
          this.dayReports.date = "";
        }
        else console.log(`Error occurred: ${response}`);
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => console.log("Record saved!"),
    });
  }


  generateTagReport = () => {
    if (this.retiredTagReports.fromDate === "" || this.retiredTagReports.toDate === "") {
      alert("Both From and To dates are required!");
      return;
    }
    const fromTimestampRange = this._utils.getUTCRangeByDate(this.retiredTagReports.fromDate);
    const toTimestampRange = this._utils.getUTCRangeByDate(this.retiredTagReports.toDate);
    this.enableLoader = true;
    this.retiredTagReports.url = "";
    this.retiredTagReports.url_bovine = "";
    this._reportService.generateTagReport({ from: fromTimestampRange.start, to: toTimestampRange.end }).subscribe({
      next: (response) => {
        if (response.success) {
          this.enableLoader = false;
          this.retiredTagReports.url = `${apiURL}/public/reports/dailyrtreport.xlsx`;
          this.retiredTagReports.url_bovine = `${apiURL}/public/reports/dailyrtreport_bovine.xlsx`;
        }
      },
      error: (error) => {
      },
      complete: () => {
        this.enableLoader = false;
      },
    });

  }


  openPdfInNewTab = (pdfUrl: string): void => {
    window.open(pdfUrl, '_blank');
  }


  downloadPDF = () => {
    this.enableLoader = true;
    const head = [["#", "DATE", "LOT#", "ANIMAL", "BREED", "SEX", "CONDEMNATION", "RFID", "OWNER", "NOTES", "WT/HEAD", "OTM"]];
    const bodyTable = this.dayReports.records.map((r: any, index: number) => [
      index + 1,
      this._utils.unixTimestampToLocal(r.id),
      r.lot,
      r.animal,
      r.breed,
      r.sex,
      r.condemnation,
      r.rfid,
      r.owner,
      r.eartag,
      r.weight,
      r.otm,
    ]);
    this._utils.generatePDF(head, bodyTable);
    this.enableLoader = false;
  }
}
