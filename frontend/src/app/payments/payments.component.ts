import { Component, Input, OnInit, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { NgForOf, NgIf } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentService, ProductService } from '../services';
import { PaymentInterface, ProductInterface } from '../interfaces/ProductInterface';
import { Utils } from '../utils';
import { apiURL } from '../consts';
import { PaginationComponent } from '../pagination/pagination.component';
import { ITEMS_PER_PAGE_FOR_PAYMENT } from '../consts';



@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    PaginationComponent,
  ],
  providers: [ProductService, PaymentService],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})

export class PaymentsComponent implements OnInit {
  apiUrl = apiURL;
  products: ProductInterface[] = [];
  productToUpdate = {} as { [key: number]: number };
  payMode = { 'lot': '', 'destination': '', 'owner': '', 'bill': '', 'killDateFrom': '', 'killDateTo': '' };
  payRecords: PaymentInterface[] = [];


  noRecordFound: boolean = false;
  selectedPayRecordsId = new Set() as Set<string>;
  billed_url: string = '';
  enableLoader: boolean = false;

  @ViewChild('billedPDFTableContainer') billedPDFTableContainer!: ElementRef;
  @ViewChildren('billedPDFTableElements') billedPDFTableElements!: QueryList<ElementRef>;
  billedData: {
    records: PaymentInterface[];
    owner: string;
    total_wt: number;
    total_pay: number;
    max_billed: number;
    bonus: number;
    bonus_comments: string;
    deductions: number;
    deductions_comments: string;
    billed_date: string;
  } = {
      records: [],
      owner: "",
      total_wt: 0,
      total_pay: 0,
      max_billed: 0,
      bonus: 0,
      bonus_comments: "~",
      deductions: 0,
      deductions_comments: "~",
      billed_date: "",
    };
  chunkedBilledRecords: PaymentInterface[][] = [];
  billRecordsPdf: any;

  constructor(private _productService: ProductService, private _payService: PaymentService, protected _utils: Utils) {
  }

  ngOnInit() {
    this.getProducts();
  }

  getProducts = () => {
    this._productService.getProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.products;
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });
  }

  recordChangeInCP = (productId: number, productCP: number) => {
    this.productToUpdate[productId] = productCP;
    console.log("productToUpdate :>", this.productToUpdate);
  };

  updateProducts = () => {
    this._productService.updateProduct(this.productToUpdate).subscribe({
      next: (response) => {
        if (response.success) {
          this.getProducts();
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => console.log("Fetching Max Lot complete"),
    });
  };

  // Pagination related functionality
  currentPage = 1;
  @Input() recordsPerPage: number = ITEMS_PER_PAGE_FOR_PAYMENT;

  get paginatedBilledData() {
    const start = (this.currentPage - 1) * this.recordsPerPage;
    return this.billedData.records.slice(start, start + this.recordsPerPage);
  }

  get paginatedPayRecords() {
    const start = (this.currentPage - 1) * this.recordsPerPage;
    return this.payRecords.slice(start, start + this.recordsPerPage);
  }

  searchByBilledNumber = () => {
    this.noRecordFound = false;
    this.billedData.records = []; // empty the list
    this.payRecords = [];
    this.billed_url = "";
    if (this.payMode.bill === "" || this.payMode.bill === "0" || this.payMode.bill === null) return;
    this.enableLoader = true;

    this._payService.getDataByBilledNo(this.payMode.bill).subscribe({
      next: (response) => {
        console.log("response :>", response);

        if (response.success) {
          if (response.result.records.length === 0) {
            this.noRecordFound = true;
            return;
          }
          this.billedData = response.result;
          this.billedData.records = this.billedData.records.sort((a: any, b: any) => b.id - a.id);
          this.billRecordsPdf = this._utils.generatePDFForSearchResult(this.billedPDFTableContainer, this.billedPDFTableElements);
          this.chunkedBilledRecords = this._utils.chunkRecords(this.billedData.records, 28)
        }
      },
      error: (error) => {
        console.log("Error in searchByBilledNumber():", error);
      },
      complete: () => {
        this.enableLoader = false;
      },
    });
  };

  deleteBill(billNumber: string): void {
    const isConfirmed = confirm(`Are you sure you want to Delete Bill#${billNumber}?`);
    if (isConfirmed) {
      console.log(`Bill#${billNumber} deleted.`);
      this._payService.removeDataByBilledNo(this.payMode.bill).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Bill#${billNumber} deleted successfully!`);
            window.location.reload();
          }
        },
        error: (error) => {
          console.log("Error in searchByBilledNumber():", error);
        },
        complete: () => {
          this.enableLoader = false;
        },
      });
    }
  }

  onSearch = () => {
    this.enableLoader = true;
    const areAllKeysEmpty = Object.values(this.payMode).every(value => value === '');
    if (areAllKeysEmpty) {
      alert("No Field selected!");
      return;
    }
    this.noRecordFound = false;
    let killDateRangeFrom, killDateRangeTo;

    if ((this.payMode.killDateFrom !== "" && this.payMode.killDateTo === "") || (this.payMode.killDateFrom === "" && this.payMode.killDateTo !== "")) {
      alert("Both From and To Kill Dates are required!");
      this.enableLoader = false;
      return;
    } else if (this.payMode.killDateFrom !== "" && this.payMode.killDateTo !== "") {
      killDateRangeFrom = this._utils.getUTCRangeByDate(this.payMode.killDateFrom);
      killDateRangeTo = this._utils.getUTCRangeByDate(this.payMode.killDateTo);
    } else {
      killDateRangeFrom = { start: "" };
      killDateRangeTo = { end: "" };
    }

    this.billedData.records = []; // empty the list
    this.payRecords = [];
    this.billed_url = "";
    this._payService.getPayRecords({
      'lot': this.payMode.lot,
      'destination': this.payMode.destination,
      'owner': this.payMode.owner,
      'kill_date_from': killDateRangeFrom.start,
      'kill_date_to': killDateRangeTo.end,
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.payRecords = response.result.records;
          if (response.result.records.length === 0) this.noRecordFound = true;
        }
      },
      error: (error) => {
        console.log("Error in searchByBilledNumber():", error);
        this.enableLoader = false;
      },
      complete: () => {
        this.enableLoader = false;
      },
    });
  };

  downloadBillPDF = () => {
    if (this.billedData.max_billed === null) {
      window.open(`${apiURL}/public//bills/${this.payMode.bill}.pdf`, '_blank');
    } else {
      this.billRecordsPdf.save(`${this.billedData.max_billed}.pdf`);
    }
  }

  downloadSearchPDF = () => {
    // Check for backend public bill folder
    this.enableLoader = true;
    const head = [["#", "DATE", "LOT #", "ANIMAL", "RFID", "OWNER", "NOTES", "LIVEPRICE", "RAILPRICE", "WT/HEAD"]];
    const bodyTable = this.payRecords.map((r, index) => [
      index + 1,
      this._utils.unixTimestampToLocal(r.id),
      r.lot,
      r.animal,
      r.rfid,
      r.owner,
      r.notes,
      r.list_price,
      r.retail_price,
      r.weight,
    ]);
    this._utils.generatePDF(head, bodyTable);
    this.enableLoader = false;

  }

  onPayRecordsCheckBoxChange = (recordId: number, event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedPayRecordsId.add(recordId.toString());
    } else {
      this.selectedPayRecordsId.delete(recordId.toString());
    }
  };

  generateBill = () => {
    this.enableLoader = true;
    const bonus = parseFloat(prompt("Bonus Amount:") || "0");
    const bonusComment = prompt("Bonus Comment:") || "~";
    const deductions = parseFloat(prompt("Deductions:") || "0");
    const deductionsComments = prompt("Deductions Comment:") || "~";
    console.log(bonus, bonusComment, deductions, deductionsComments)
    if (this.selectedPayRecordsId.size <= 0) {
      alert("Select at least 1 animal");
      this.enableLoader = false;
      return;
    }

    this.billedData.records = []; // empty the list
    this.payRecords = [];
    this.billed_url = "";

    this._payService.addToBilling({
      bonus,
      bonusComment,
      deductions,
      deductionsComments,
      ids: Array.from(this.selectedPayRecordsId).join(',')
    }).subscribe({
      next: (response) => {
        console.log("Inside generateBill response :>", response)
        if (response.success) {
          this.billedData = response.result;
          this.billedData.records = this.billedData.records.sort((a: any, b: any) => b.id - a.id);
          this.billRecordsPdf = this._utils.generatePDFForSearchResult(this.billedPDFTableContainer, this.billedPDFTableElements);
          this.chunkedBilledRecords = this._utils.chunkRecords(this.billedData.records, 28)
          this.currentPage = 1;
          this.enableLoader = false;
        }
      },
      error: (error) => {
        console.log("Error in searchByBilledNumber():", error);
        this.enableLoader = false;
      },
      complete: () => {
        this.enableLoader = false;
        this.selectedPayRecordsId.clear();
      },
    });
  };

  reset = () => {
    this.payMode = { 'lot': '', 'destination': '', 'owner': '', 'bill': '', 'killDateFrom': '', 'killDateTo': '' };
    this.billedData = {
      records: [],
      owner: "",
      total_wt: 0,
      total_pay: 0,
      max_billed: 0,
      bonus: 0,
      bonus_comments: "",
      deductions: 0,
      deductions_comments: "",
      billed_date: "",
    };
    this.payRecords = [];
    this.billed_url = "";
  };
}
