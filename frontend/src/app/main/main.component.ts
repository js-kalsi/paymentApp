import { Component, OnInit, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Utils } from '../utils';
import { RecordsService } from '../services/record.service';
import { SessionService } from '../services/session-service';
import { NgIf, NgFor } from '@angular/common';
import { mainModeInterface, recordInterface } from '../interfaces/mainMode.interface';
import { apiURL, ITEMS_PER_PAGE_FOR_SEARCH } from '../consts';
import { RecordsTableComponent } from '../records-table/records-table.component';
import { RecordsHelperService } from '../services/records-helper.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    RecordsTableComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})

export class MainComponent implements OnInit {

  initializeEntryMode = () => {
    return {
      firstName: "",
      lastName: "",
      paymentStatus: "",
      dueDate: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      country: "",
      provinceOrState: "",
      postalCode: "",
      phoneNumber: "",
      email: "",
      currency: "",
      discountPercent: null,
      taxPercent: null,
      dueAmount: null
    };
  };
  mainMode: mainModeInterface = this.initializeEntryMode();
  records: recordInterface[] = [];
  editMode: boolean = false;

  paymentStatusOptions: {
    key: string;
    value: string
  }[] = [
      { key: "completed", value: "Completed" },
      { key: "due_now", value: "Due Now" },
      { key: "overdue", value: "Overdue" },
      { key: "pending", value: "Pending" },
    ];
  enableLoader: boolean = false;



  constructor(
    protected _utils: Utils,
    private _recordsService: RecordsService,
    private _sessionService: SessionService,) { }

  // Pagination related functionality
  recordsPerPage: number = ITEMS_PER_PAGE_FOR_SEARCH;


  ngOnInit() {

  }

  resetSearch = () => {
    this.mainMode = this.initializeEntryMode();
    this.records = [];
  }


  onSearch = () => {
    this.enableLoader = true;
    console.log(this.mainMode)
    // this.records = [];
    // if ((this.mainMode.killDateFrom == "" && this.mainMode.killDateTo != "") || (this.mainMode.killDateFrom != "" && this.mainMode.killDateTo == "")) {
    //   alert("Both from and to KillDates are required!");
    //   return;
    // }
    // let startKillDate = "";
    // let endKillDate = "";
    // if (this.mainMode.killDateFrom != "" && this.mainMode.killDateFrom != "") {
    //   const killDateFrom = this._utils.getUTCRangeByDate(this.mainMode.killDateFrom);
    //   startKillDate = killDateFrom['start'].toString();
    //   const killDateTo = this._utils.getUTCRangeByDate(this.mainMode.killDateTo);
    //   endKillDate = killDateTo['end'].toString()
    // }
    // this.enableLoader = true;
    // const record: searchRecordInterface = {
    //   eartag: this.mainMode.eartag,
    //   rfid: `${this.mainMode.rfid}`,
    //   kill_date_from: startKillDate,
    //   kill_date_to: endKillDate,
    //   lot: `${this.mainMode.lot}`,
    //   owner: this.mainMode.owner,
    //   bill_to: this.mainMode.billTo,
    //   otm: this.mainMode.otm
    // };
    // this._recordsService.searchRecord(record).subscribe({
    //   next: (response) => {
    //     if (response.success) {
    //       this.records = response.records.sort((a: any, b: any) => b.id - a.id);
    //       this.enableLoader = false;
    //     }
    //   },
    //   error: (error) => console.error("Error occurred:", error),
    //   complete: () => {
    //     this.enableLoader = false;
    //   },
    // });
  }

  deleteRecord = (recordId: string) => { }
  editRecord = (record: recordInterface) => { }
  readRecord = (record: recordInterface) => { }
}
