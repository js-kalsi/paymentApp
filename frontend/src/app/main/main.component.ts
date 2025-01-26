import { Component, OnInit } from '@angular/core';
import { FormsModule, FormGroup, ReactiveFormsModule, FormControl } from "@angular/forms";
import { Utils } from '../utils';
import { PaymentService } from '../services/payment.service';
import { NgIf, NgFor } from '@angular/common';
import { searchRecordInterface } from '../interfaces/main.interface';
import { apiURL, PAGINATION_SEARCH_LIMIT, paymentStatusOptions } from '../consts';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    RouterModule,
  ],
  providers: [PaymentService],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  searchModeForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    paymentStatus: new FormControl(''),
    dueDate: new FormControl(''),
    addressLine1: new FormControl(''),
    addressLine2: new FormControl(''),
    city: new FormControl(''),
    country: new FormControl(''),
    provinceOrState: new FormControl(''),
    postalCode: new FormControl(''),
    phoneNumber: new FormControl(''),
    email: new FormControl(''),
    currency: new FormControl(''),
  });

  records: searchRecordInterface[] = [];
  editMode: boolean = false;
  enableLoader: boolean = false;

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalRecords: number = 0;
  recordsPerPage: number = PAGINATION_SEARCH_LIMIT; // Items per page
  visiblePages: number[] = []; // Dynamic pages visible in the pagination bar
  maxVisiblePages: number = 5; // Maximum visible pages in the pagination control

  paymentStatusOptions: {
    key: string;
    value: string;
  }[] = paymentStatusOptions;

  constructor(
    protected _utils: Utils,
    private _payService: PaymentService,
  ) { }

  ngOnInit() {
    this.onSearch();
  }

  resetSearch = () => {
    this.records = [];
    this.searchModeForm.reset();
    this.currentPage = 1; // Reset pagination when resetting the form
    this.onSearch();
  };

  onSearch = () => {
    this.enableLoader = true;
    const formValues = this.searchModeForm.value;

    let payload: any = {
      mode: 'search',
      page: this.currentPage,
      limit: this.recordsPerPage,
    };

    if (!this.isFormValueInvalid(formValues.firstName)) {
      payload["payee_first_name"] = formValues.firstName;
    }
    if (!this.isFormValueInvalid(formValues.lastName)) {
      payload["payee_last_name"] = formValues.lastName;
    }
    if (!this.isFormValueInvalid(formValues.paymentStatus)) {
      payload["payee_payment_status"] = formValues.paymentStatus;
    }
    if (!this.isFormValueInvalid(formValues.dueDate)) {
      payload["payee_due_date"] = formValues.dueDate;
    }
    if (!this.isFormValueInvalid(formValues.addressLine1)) {
      payload["payee_address_line_1"] = formValues.addressLine1;
    }
    if (!this.isFormValueInvalid(formValues.addressLine2)) {
      payload["payee_address_line_2"] = formValues.addressLine2;
    }
    if (!this.isFormValueInvalid(formValues.city)) {
      payload["payee_city"] = formValues.city;
    }
    if (!this.isFormValueInvalid(formValues.country)) {
      payload["payee_country"] = formValues.country;
    }
    if (!this.isFormValueInvalid(formValues.provinceOrState)) {
      payload["payee_province_or_state"] = formValues.provinceOrState;
    }
    if (!this.isFormValueInvalid(formValues.postalCode)) {
      payload["payee_postal_code"] = formValues.postalCode;
    }
    if (!this.isFormValueInvalid(formValues.phoneNumber)) {
      payload["payee_phone_number"] = formValues.phoneNumber;
    }
    if (!this.isFormValueInvalid(formValues.email)) {
      payload["payee_email"] = formValues.email;
    }
    if (!this.isFormValueInvalid(formValues.currency)) {
      payload["payee_currency"] = formValues.currency;
    }

    this._payService.searchRecord(payload).subscribe({
      next: (response) => {
        this.records = response.data;
        this.totalRecords = response.total;
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
        this.updateVisiblePages();
      },
      error: (error) => {
        console.error("Error in search:", error);
      },
      complete: () => {
        this.enableLoader = false;
      },
    });
  };

  isFormValueInvalid(value: any): boolean {
    return value === null || value === undefined || value === "";
  }

  // Pagination navigation
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.onSearch(); // Fetch records for the selected page
    }
  }

  // Update the range of visible pages in the pagination bar
  updateVisiblePages(): void {
    const start = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
    const end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    this.visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Calculate row index based on page and records per page
  calculateRowIndex(index: number): number {
    return (this.currentPage - 1) * this.recordsPerPage + index + 1;
  }

  deleteRecord = (payId: string) => {
    this._payService.rmRecord(payId).subscribe({
      next: (response) => {
        this.onSearch();

      },
      error: (error) => {
        console.error("Error in search:", error);
      },
      complete: () => {
      },
    });
  };

}
