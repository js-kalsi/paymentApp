import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionService } from '../services/session-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';

import { Utils } from '../utils';
import { apiURL, ITEMS_PER_PAGE_FOR_RECORDS } from '../consts';
import { RecordsService } from '../services/record.service';
import { RecordsTableComponent } from '../records-table/records-table.component';
import { ReloadStatisticsService } from '../services/reload-statistics-service';
import { recordInterface } from '../interfaces/recordInterface';
import { PrintPdfComponent } from '../print-pdf/print-pdf.component';

@Component({
  selector: 'app-office-mode',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    RecordsTableComponent,
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    AngularMultiSelectModule,
    PrintPdfComponent,
  ],
  providers: [],
  templateUrl: './office-mode.component.html',
  styleUrl: './office-mode.component.css'
})
export class OfficeModeComponent implements OnInit {
  apiURL = apiURL;
  @ViewChild(PrintPdfComponent) printPDF!: PrintPdfComponent;

  entryMode: any = {
    lot: "",
    base: "0000",
    killDate: "",
    billTo: "",
    owner: "",
    rfid: null,
    animal: "",
    weight: null,
    notes: "NA",
    breed: "",
    condemnation: "",
    sex: "",
    otm: "",
  };
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
  records: recordInterface[] = [];
  recordsPerPage: number = ITEMS_PER_PAGE_FOR_RECORDS;
  editMode: boolean = false;
  editModeRecord: any;
  otmOptions = [
    { id: 'Y', name: 'Yes' },
    { id: 'N', name: 'No' },
  ];

  base: string = ""
  disableOTM: boolean = false;
  validRFID: boolean = true;

  constructor(private _router: Router,
    protected _utils: Utils,
    private _recordsService: RecordsService,
    private _sessionService: SessionService,
    private _reloadStatisticsService: ReloadStatisticsService,
  ) {
  }

  async ngOnInit() {
    this._sessionService.setMode('office');
    console.log("Inside Office mode:", this._sessionService.getMode());
    this.entryMode.base = this._sessionService.getBase();
    this.get_statistics();
    this._reloadStatisticsService.change$.subscribe((value) => {
      console.log("I am inside parent component :>", value)
      if (value) {
        this.get_statistics();
      }
    });
    this._recordsService.getDataFromEntries().subscribe({
      next: (response) => {
        this.entryMode.lot = response.maxLot + 1;
        this.entryMode.killDate = this._utils.unixTimestampToLocal(response.killDate);
        this.entryMode.owner = response.owner;
        this.entryMode.billTo = response.billTo;
        this.entryMode.animal = response.animal;
        this.changeOTMByAnimal();
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => console.log("Fetching Max Lot complete"),
    });

    this._recordsService.getAllOwners().subscribe({
      next: (response) => {
        if (response.success) {
          this.owners = response.owners;
          this.filteredOwners = response.owners;
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  }


  get_statistics = () => {
    console.log("get_statistics() is called!")
    const { start, end } = this._utils.getUTCRangeByDate();
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

  setBase = () => {
    this.entryMode.base = this.entryMode.base.toString().padStart(4, '0');
    alert(`Base# Set to ${this.entryMode.base}`);
    this._sessionService.setBase(this.entryMode.base);
  };

  onChangeAnimal = (event: Event) => {
    this.entryMode.animal = (event.target as HTMLSelectElement).value;
    this.changeOTMByAnimal();
  };

  changeOTMByAnimal = () => {
    if (["Lamb", "Sheep", "Goat"].includes(this.entryMode.animal)) {
      this.entryMode.otm = "N";
      this.disableOTM = true;
    } else {
      this.disableOTM = false;
      this.entryMode.otm = "";
    }
  };

  onChangeOTM = (event: Event) => {
    this.entryMode.otm = (event.target as HTMLSelectElement).value;
  };

  onChangeSex = (event: Event) => {
    this.entryMode.sex = (event.target as HTMLSelectElement).value;
  };

  onChangeBreed = (event: Event) => {
    this.entryMode.breed = (event.target as HTMLSelectElement).value;
  };

  onChangeCondemnation = (event: Event) => {
    this.entryMode.condemnation = (event.target as HTMLSelectElement).value;
  };

  onSave = () => {
    let isValid: boolean = true;
    let breed = "";
    if (this.entryMode.rfid === "" || this.entryMode.rfid === null) {
      alert("Enter RFID");
      isValid = false;
      return;
    }
    else if (this.entryMode.rfid.length > 15) {
      if (!confirm("RFID is greater than 15 digits. Do you want to continue?")) {
        isValid = false;
        return;
      } else {
        isValid = true;
      }
    }
    else if (this.entryMode.rfid.length < 15) {
      if (!confirm("RFID is smaller than 15 digits. Do you want to continue?")) {
        isValid = false;
        return;
      } else {
        isValid = true;
      }
    }
    else if (!this.entryMode.rfid.startsWith('124000')) {
      if (!confirm("RFID doesn't start with 124000!")) {
        isValid = false;
        return;
      } else {
        isValid = true;
      }
    }

    if (this.entryMode.weight < 0 || this.entryMode.weight === null) {
      alert("Enter Weight");
      isValid = false;
      return;
    }
    if (this.entryMode.animal === "" || this.entryMode.animal === null) {
      alert("Enter Animal");
      isValid = false;
      return;
    }
    if (this.entryMode.animal === "Bovine(Beef)" || this.entryMode.animal === "Bovine(Veal)") {
      breed = this.breedSelectedItems.map((b) => b.itemName).join(",");

      if (breed === "" || breed === null) {
        alert("Enter Breed");
        isValid = false;
        return;
      }
      if (this.entryMode.sex === "" || this.entryMode.sex === null) {
        alert("Enter Sex");
        isValid = false;
        return;
      }
    }
    if (this.entryMode.otm === "" || this.entryMode.otm === null) {
      alert("Enter OTM");
      isValid = false;
      return;
    }

    if (isValid) {
      const currentTimeStamp = this._utils.localToUnixTimestamp();
      const record = {
        id: currentTimeStamp,
        lot: this.entryMode.lot,
        kill_date: this._utils.localToUnixTimestamp(this.entryMode.killDate),
        bill_to: this.entryMode.billTo,
        owner: this.entryMode.owner,
        rfid: this.entryMode.rfid.toString(),
        type: this.entryMode.animal,
        weight: this.entryMode.weight,
        eartag: this.entryMode.notes,
        breed: breed,
        condemnation: this.condemnationSelectedItems.map((c) => c.itemName).join(","),
        sex: this.entryMode.sex,
        otm: this.entryMode.otm,
        base: this.entryMode.base
      };
      this._recordsService.saveRecord(record).subscribe({
        next: (response) => {
          if (response.success) {
            alert("Data saved successfully!");

            const dateRange = this._utils.getUTCRangeByDate();
            this._recordsService.getTodayProject(dateRange['start'], currentTimeStamp).subscribe({
              next: (response) => {
                if (response.success) {
                  try {
                    this.printPDF.generateEntryPDF({
                      id: this._utils.localToUnixTimestamp(),
                      sno: response.entries.length,
                      owner: this.entryMode.owner,
                      billTo: this.entryMode.billTo,
                      lot: this.entryMode.lot,
                      killDate: this.entryMode.killDate,
                      base: this.entryMode.base,
                      animal: this.entryMode.animal,
                      rfid: this.entryMode.rfid,
                      notes: this.entryMode.notes,
                      weight: this.entryMode.weight,
                      otm: this.entryMode.otm,
                      condemnation: record.condemnation,
                      sex: record.sex,
                      breed: record.breed
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
        },
        error: (error) => console.error("Error occurred:", error),
        complete: () => console.log("Record saved!"),
      });
    }
  }

  // Breed MultiSelect related variables
  breedDropdownList: { id: number, itemName: string }[] = [
    { "id": 1, "itemName": "Black" },
    { "id": 2, "itemName": "Red" },
    { "id": 3, "itemName": "Hols" },
    { "id": 4, "itemName": "HolsX" },
    { "id": 5, "itemName": "Tan" },
    { "id": 6, "itemName": "Herf" },
    { "id": 7, "itemName": "Cross" },
    { "id": 8, "itemName": "Jers" },
    { "id": 9, "itemName": "Grey" },
    { "id": 10, "itemName": "Char" },
    { "id": 11, "itemName": "Baldie" },
    { "id": 12, "itemName": "B/W" },
    { "id": 13, "itemName": "Speck" },
    { "id": 14, "itemName": "Wagyu" },
    { "id": 15, "itemName": "Gallo" },
    { "id": 16, "itemName": "Shrt Hrn" },
    { "id": 17, "itemName": "Lng Hrn" },
    { "id": 18, "itemName": "White" },
    { "id": 19, "itemName": "Boer" }
  ];
  breedSelectedItems: { id: number, itemName: string }[] = [];
  breedDropdownSettings = {
    singleSelection: false,
    text: "Select Breed",
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    enableSearchFilter: true,
    classes: "form-select-custom p-0",
    searchPlaceholderText: "Select Breed",
    maxHeight: 200,
    lazyLoading: true,
    showCheckbox: true,
  };

  // Condemnation MultiSelect related variables
  condemnationDropdownList: { id: number, itemName: string }[] = [
    { "id": 1, "itemName": "Lungs" },
    { "id": 2, "itemName": "Liver" },
    { "id": 3, "itemName": "Kidney" },
    { "id": 4, "itemName": "Heart" },
    { "id": 5, "itemName": "Tongue" },
    { "id": 6, "itemName": "Spleen" },
    { "id": 7, "itemName": "Excess Trim" },
    { "id": 8, "itemName": "Heavy Tag" },
    { "id": 9, "itemName": "Parts Condemned" },
    { "id": 10, "itemName": "Whole Condemned" },
    { "id": 11, "itemName": "Undeclared" },
  ];
  condemnationSelectedItems: { id: number, itemName: string }[] = [];
  condemnationDropdownSettings = {
    singleSelection: false,
    text: "Select Condemnation",
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    enableSearchFilter: true,
    classes: "form-select-custom p-0",
    searchPlaceholderText: "Select Condemnation",
    maxHeight: 200,
    lazyLoading: true,
    showCheckbox: true,
  };

  validateRFID = () => {
    if (this.entryMode.rfid.length <= 0) {
      return;
    }
    this._recordsService.checkIFRFIDExist(this.entryMode.rfid).subscribe({
      next: (response) => {
        console.log("Response for RFID:", response)
        if (response.success) {
          this.validRFID = true;
        }
        else {
          this.validRFID = false;
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  };

  owners: string[] = []; // Contains all the owners from the database.
  filteredOwners: string[] = [];
  showDropdown = false;
  filterOwners(): void {
    const searchTerm = this.entryMode.owner.trim().toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredOwners = this.owners.filter((owner) =>
        owner.toLowerCase().includes(searchTerm)
      );
      this.showDropdown = this.filteredOwners.length > 0;
    } else this.showDropdown = false;
  }

  selectOwner(owner: string): void {
    this.entryMode.owner = owner;
    this.showDropdown = false;
  }

  hideDropdownWithDelay(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
}
