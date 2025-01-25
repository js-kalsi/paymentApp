import { Component, OnChanges, OnInit, SimpleChanges, Input, ViewChild } from '@angular/core';
import { recordInterface, updateRecordInterface } from '../interfaces/recordInterface';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';


import { Utils } from '../utils';
import { RecordsService } from '../services/record.service';
import { SessionService } from '../services/session-service';
import { PaginationComponent } from '../pagination/pagination.component';
import { PrintPdfComponent } from '../print-pdf/print-pdf.component';
import { RecordsHelperService } from '../services/records-helper.service';

@Component({
  selector: 'app-records-table',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    NgIf,
    NgClass,
    PaginationComponent,
    AngularMultiSelectModule,
    PrintPdfComponent,
  ],
  providers: [RecordsService, SessionService,],
  templateUrl: './records-table.component.html',
  styleUrl: './records-table.component.css'
})
export class RecordsTableComponent implements OnInit, OnChanges {
  @Input() records: recordInterface[] = [];
  @Input() componentType: string = 'records';
  // @Input() updateRecord!: (record: updateRecordInterface) => Promise<recordInterface[]>;
  // @Input() readRecord!: (record: any) => void;
  // @Input() deleteRecord!: (id: number) => Promise<recordInterface[]>;
  @ViewChild(PrintPdfComponent) printPDF!: PrintPdfComponent;

  editMode: boolean = false;
  editModeRecord: any;
  otmOptions = [
    { id: 'Y', name: 'Yes' },
    { id: 'N', name: 'No' },
  ];
  sexButtons: string[] = ['', 'Steer', 'Heifer', 'Bull', 'Cow', 'VCM', 'VCF', 'HCM', 'HCF'];
  animalButtons: string[] = ['', "Bovine(Beef)", "Bovine(Veal)", "Lamb", "Sheep", "Goat", "Bison", "Deer", "Elk", "Buffalo"];

  // Owners realted variables
  owners: string[] = []; // Contains all the owners from the database.
  filteredOwners: string[] = [];
  showDropdown = false;

  constructor(private _router: Router,
    protected _utils: Utils,
    private _recordService: RecordsService,
    private _sessionService: SessionService,
    protected _recordsHelperService: RecordsHelperService) {
  }

  async ngOnInit(): Promise<void> {
    if (this.componentType === 'records') {
      const dateRange = this._utils.getUTCRangeByDate();
      this.records = await this._recordsHelperService.getTodayEntries(dateRange.start, dateRange.end);
    }
    this._recordService.getAllOwners().subscribe({
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

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Data input changed:')
    if (changes['data']) {
      console.log('Data input changed:', changes['data'].currentValue);
    }
  }

  editRecord = (record: recordInterface) => {
    this.editMode = true;
    this.editModeRecord = {
      'id': record.id,
      'rfid': record.rfid,
      'kill_date': this._utils.unixTimestampToLocal(record.kill_date),
      'owner': record.owner,
      'lot': record.lot,
      'eartag': record.eartag,
      'type': record.type,
      'weight': record.weight,
      'otm': record.otm,
      'bill_to': record.bill_to,
      'sex': record.sex,
    };
    this.breedSelectedItems = [];
    this.condemnationSelectedItems = [];
    const breedArray = record.breed.split(',');
    for (let b in breedArray) {
      for (let breedDropdownListId in this.breedDropdownList) {
        if (breedArray[b].trim() === this.breedDropdownList[breedDropdownListId].itemName.trim()) {
          this.breedSelectedItems.push(this.breedDropdownList[breedDropdownListId]);
        }
      }
    }
    const condemnationArray = record.condemnation.split(',');
    for (let c in condemnationArray) {
      for (let condemnationDropdownListId in this.condemnationDropdownList) {
        if (condemnationArray[c].trim() === this.condemnationDropdownList[condemnationDropdownListId].itemName.trim()) {
          this.condemnationSelectedItems.push(this.condemnationDropdownList[condemnationDropdownListId]);
        }
      }
    }


  };

  readRecord = (r: any) => {
    r.base = parseInt(this._sessionService.getBase());
    const currentTimeStamp = this._utils.localToUnixTimestamp();
    const dateRange = this._utils.getUTCRangeByDate();
    this._recordService.getTodayProject(dateRange['start'], currentTimeStamp).subscribe({
      next: (response) => {
        if (response.success) {
          try {
            this.printPDF.generateEntryPDF({
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


  reset = () => {
    this.editMode = false;
  };


  // Pagination related functionality
  currentPage = 1;
  @Input() recordsPerPage: number = 10;

  get paginatedItems() {
    const start = (this.currentPage - 1) * this.recordsPerPage;
    return this.records.slice(start, start + this.recordsPerPage);
  }


  updateData = async (record: updateRecordInterface) => {
    this.editMode = true;
    record.breed = Array.from(this.breedSelectedItems).map((item: any) => item.itemName).join(',');
    record.condemnation = Array.from(this.condemnationSelectedItems).map((item: any) => item.itemName).join(', ');
    const updatedRecord = await this._recordsHelperService.updateRecord(record);
    if (this.componentType === 'records') {
      this.records = updatedRecord;
    }
    else if (this.componentType === 'search') {
      this.records = [];
      window.location.reload();
    }

    this.editMode = false;
  }


  deleteData = async (recordId: number) => {
    const remainingRecord = await this._recordsHelperService.deleteRecord(recordId);
    if (this.componentType === 'records') {
      this.records = remainingRecord;
    } else if (this.componentType === 'search') {
      this.records = [];
      window.location.reload();
    }
  }

  filterOwners(): void {
    const searchTerm = this.editModeRecord.owner.trim().toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredOwners = this.owners.filter((owner) =>
        owner.toLowerCase().includes(searchTerm)
      );
      this.showDropdown = this.filteredOwners.length > 0;
    } else this.showDropdown = false;
  }

  selectOwner(owner: string): void {
    this.editModeRecord.owner = owner;
    this.showDropdown = false;
  }

  hideDropdownWithDelay(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
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

}

