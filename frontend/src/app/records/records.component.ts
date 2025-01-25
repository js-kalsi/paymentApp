import { Component, OnInit, ViewChild } from '@angular/core';

import { RecordsTableComponent } from '../records-table/records-table.component';
import { RecordsHelperService } from '../services/records-helper.service';

import { ITEMS_PER_PAGE_FOR_RECORDS } from '../consts';
import { Utils } from '../utils';
import { PrintPdfComponent } from '../print-pdf/print-pdf.component';
import { recordInterface } from '../interfaces/recordInterface';
import { RecordsService } from "../services/record.service";
import { SessionService } from '../services/session-service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [
    RecordsTableComponent,
  ],
  providers: [RecordsHelperService, RecordsService, PrintPdfComponent],
  templateUrl: './records.component.html',
  styleUrl: './records.component.css'
})
export class RecordsComponent implements OnInit {
  records: recordInterface[] = [];
  recordsPerPage: number = ITEMS_PER_PAGE_FOR_RECORDS;

  constructor(protected _utils: Utils,
    protected _recordsHelperService: RecordsHelperService,
    private _recordsService: RecordsService,
    private _sessionService: SessionService,
    private _printPDF: PrintPdfComponent) {
  }

  async ngOnInit(): Promise<void> {
    const dateRange = this._utils.getUTCRangeByDate();
    this.records = await this._recordsHelperService.getTodayEntries(dateRange.start, dateRange.end);
  }

  // readRecord = (r: any) => {
  //   const currentTimeStamp = this._utils.localToUnixTimestamp();
  //   const dateRange = this._utils.getUTCRangeByDate();
  //   this._recordsService.getTodayProject(dateRange['start'], currentTimeStamp).subscribe({
  //     next: (response) => {
  //       if (response.success) {
  //         try {
  //           this.printPDF.generateEntryPDF({
  //             id: this._utils.localToUnixTimestamp(),
  //             sno: response.entries.length,
  //             owner: r.owner,
  //             billTo: r.bill_to,
  //             lot: `${r.lot}`,
  //             killDate: r.kill_date,
  //             base: 'r.base',
  //             animal: r.type,
  //             rfid: r.rfid,
  //             notes: r.eartag,
  //             weight: r.weight,
  //             otm: r.otm,
  //             condemnation: r.condemnation,
  //             sex: r.sex,
  //             breed: r.breed
  //           });
  //         } catch (error) {
  //           console.error("Error while generating PDF:", error);
  //         }
  //       } else {
  //         console.log('Getting error while executing _getProductsInfoService()', response);
  //       }
  //     },
  //     error: (error) => console.error("Error occurred:", error),
  //     complete: () => { },
  //   });
  // };



  readRecord = (r: any) => {
    r.base = parseInt(this._sessionService.getBase());
    const currentTimeStamp = this._utils.localToUnixTimestamp();
    const dateRange = this._utils.getUTCRangeByDate();
    this._recordsService.getTodayProject(dateRange['start'], currentTimeStamp).subscribe({
      next: (response) => {
        if (response.success) {
          try {
            this._printPDF.generateEntryPDF({
              id: this._utils.localToUnixTimestamp(),
              sno: response.entries.length,
              owner: r.owner,
              billTo: r.bill_to,
              lot: `${r.lot}`,
              killDate: r.kill_date,
              base: r.base,
              animal: r.type,
              rfid: r.rfid,
              notes: r.eartag,
              weight: r.weight,
              otm: r.otm,
              condemnation: r.condemnation,
              sex: r.sex,
              breed: r.breed
            }, 'office-mode');
          } catch (error) {
            console.error("Error while generating PDF:", error);
          }
        } else {
          console.log('Getting error while executing _getProductsInfoService()', response);
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => { },
    });
  }

}