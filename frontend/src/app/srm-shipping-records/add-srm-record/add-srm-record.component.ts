import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { SrmShippingService } from '../../services/srm-shipping-service';
import { Utils } from "../../utils";

@Component({
  selector: 'app-srm-shipping-records',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf
  ],
  providers: [SrmShippingService],
  templateUrl: './add-srm-record.component.html',
  styleUrl: './add-srm-record.component.css'
})
export class AddSRMRecordComponent implements OnInit {
  srmRecord = { 'date': '', 'srmEodWeight': '' }
  records: { date: number; weight: number }[] = [];
  disableAddButton: boolean = false;
  constructor(private _srmShippingService: SrmShippingService, protected _utils: Utils) {
  }

  ngOnInit(): void {
    const today = new Date();
    this.srmRecord.date = today.toISOString().split('T')[0];
    this.getAllSRMRecord();
  }

  saveSrmEodWeight() {
    const record = {
      date: this._utils.localToUnixTimestamp(this.srmRecord.date),
      weight: Number(this.srmRecord.srmEodWeight)
    }
    this._srmShippingService.saveSRMShippingRecord(record).subscribe({
      next: (response) => {
        if (response.success) this.getAllSRMRecord();
        else console.log(`Error occurred: ${response}`);
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => console.log("Record saved!"),
    });
  }

  getAllSRMRecord = () => {
    this._srmShippingService.getSrmShippingRecordByCurrentYear().subscribe({
      next: (response) => {
        if (response.success) {
          console.log("response.all_srm_records :>?", response.all_srm_records, typeof (this.srmRecord.date))
          this.records = response.all_srm_records;
          this.records = this.records.sort((a, b) => b.date - a.date);
          if (this.records.some(item => this._utils.unixTimestampToLocal(item.date) === this.srmRecord.date)) this.disableAddButton = true;
          else this.disableAddButton = false;

        } else console.log(`Error occurred: ${response}`)
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  }

  rmRecord(id: number): void {
    this._srmShippingService.rmRecordById(id).subscribe({
      next: (response) => {
        this.getAllSRMRecord();
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  }

}
