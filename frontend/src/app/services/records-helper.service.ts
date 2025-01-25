
import { RecordsService } from './record.service';
import { SessionService } from './session-service';
import { ViewChild } from '@angular/core';
import { recordInterface, updateRecordInterface } from '../interfaces/recordInterface';
import { Router } from '@angular/router';
import { Utils } from '../utils';
import { ReloadStatisticsService } from './reload-statistics-service';
import { PrintPdfComponent } from '../print-pdf/print-pdf.component';
import { apiURL } from '../consts';
import { Injectable } from '@angular/core';



@Injectable({
    providedIn: 'root',
})

export class RecordsHelperService {
    apiURL = apiURL
    constructor(private _router: Router,
        protected _utils: Utils,
        private _recordService: RecordsService,
        private _sessionService: SessionService,
        private _reloadStatisticsService: ReloadStatisticsService) {
    }
    @ViewChild(PrintPdfComponent) printPDF!: PrintPdfComponent;



    getTodayEntries = (startDate: number, endDate: number): Promise<recordInterface[]> => {
        return new Promise((resolve, reject) => {
            this._recordService.getTodayProject(startDate, endDate).subscribe({
                next: (response) => {
                    console.log("response.entries :>", response.entries)
                    resolve(response.entries.sort((a: any, b: any) => b.id - a.id));
                },
                error: (error) => {
                    console.error("Error occurred:", error);
                    reject(error);
                },
                complete: () => console.log("Fetching Max Lot complete"),
            });
        });
    };


    updateRecord = (r: updateRecordInterface): Promise<recordInterface[]> => {
        return new Promise((resolve, reject) => {
            const recordToUpdate = {
                id: r.id,
                kill_date: this._utils.localToUnixTimestamp(r.kill_date),
                rfid: r.rfid.toString(),
                owner: r.owner,
                lot: r.lot,
                eartag: r.eartag,
                type: r.type,
                weight: r.weight,
                otm: r.otm,
                bill_to: r.bill_to,
                sex: r.sex,
                breed: r.breed,
                condemnation: r.condemnation
            }
            this._recordService.updateRecord(recordToUpdate).subscribe({
                next: (response) => {
                    if (response.success) {
                        const dateRange = this._utils.getUTCRangeByDate();
                        resolve(this.getTodayEntries(dateRange.start, dateRange.end));
                    }
                },
                error: (error) => {
                    console.error("Error occurred:", error);
                    reject(error);
                },
                complete: () => {
                    this._reloadStatisticsService.notifyChange(true);
                },
            });

        });

    };


    // readRecord = (r: recordInterface): Promise<HTMLAnchorElement> => {
    //     return new Promise((resolve, reject) => {
    //         r.base = parseInt(this._sessionService.getBase());
    //         this._recordService.generatePDF(r).subscribe({
    //             next: (response) => {
    //                 this._utils.printPDFFromBlob(`${this.apiURL}/${response.pdf_path}`);
    //             },
    //             error: (error) => {
    //                 console.error("Error occurred:", error)
    //                 reject(error);
    //             },
    //             complete: () => { },
    //         });
    //     });

    // };



    deleteRecord = (recordId: number): Promise<recordInterface[]> => {
        return new Promise((resolve, reject) => {
            // this.records = records.filter((entry) => entry.id !== recordId);
            console.log("Inside servuce: recordId:", recordId)
            this._recordService.rmRecord(recordId).subscribe({
                next: async (response) => {
                    if (response.success) {
                        const dateRange = this._utils.getUTCRangeByDate();
                        const records = await this.getTodayEntries(dateRange.start, dateRange.end);
                        resolve(records);
                    }
                },
                error: (error) => {
                    console.error("Error occurred:", error);
                    reject(error);
                },
                complete: () => {
                    this._reloadStatisticsService.notifyChange(true);
                },
            });
        });
    };

}