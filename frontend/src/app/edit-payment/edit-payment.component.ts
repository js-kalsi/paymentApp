import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { paymentStatusOptions } from '../consts';
import { PaymentService } from '../services/payment.service';
import { Utils } from '../utils';
import { recordInterface, backendRecordInterface } from '../interfaces/edit.interface';
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-payment',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
  ],
  providers: [PaymentService],
  templateUrl: './edit-payment.component.html',
  styleUrl: './edit-payment.component.css'
})
export class EditPaymentComponent implements OnInit {
  record: recordInterface = {} as recordInterface;
  paymentStatusOptions = paymentStatusOptions;
  invalidForm: boolean = false;

  constructor(protected _utils: Utils, private _route: ActivatedRoute, private _router: Router, private _payService: PaymentService) {

  }

  ngOnInit(): void {
    this._route.paramMap.subscribe(params => {
      const paymentId = params.get('id');
      this._payService.searchRecord({ paymentId: paymentId, mode: 'edit' }).subscribe({
        next: (response) => {
          this.record = this._utils.transformBackendPayloadToRecords(response.data)[0];
          console.log("this.record:>", this.record);
        },
        error: (error) => {
          console.error("Error in search:", error);
        },
        complete: () => {
        },
      });
    });
  }

  updatePayment() {
    console.log("this.record :>", this.record);

    // const payload: backendRecordInterface = this._utils.transformRecordToBackendPayload(this.record);
    // console.log("payload :>", payload);
    // this._payService.updateRecord(payload).subscribe({
    //   next: (response) => {
    //     setTimeout(() => {
    //       alert('Payment updated successfully!');
    //       this._router.navigate(['/']); // Redirect to main component
    //     }, 1000);
    //   },
    //   error: (error) => {
    //     console.error("Error occurred:", error);
    //   },
    //   complete: () => {
    //   },
    // });

  }

  back = () => {
    this._router.navigate(['/']);
  }

  onFileChange(event: any) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      const fileType = file.type;
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];

      // Check if the file type is valid
      if (!validTypes.includes(fileType)) {
        alert('Invalid file type! Only PDF, PNG, JPG, or JPEG are allowed.');
        event.target.value = ''; // Clear the input if invalid
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result?.toString().split(',')[1]; // Get Base64 content
        this.record.evidenceFile = {
          fileData: base64Data || null,
          fileName: file.name,
          contentType: fileType,
        };
      };

      reader.readAsDataURL(file); // Read file as Base64
    }
  }

  validateForm = () => {
    if (this.record.firstName) {

    } else if (this.record.lastName) {

    } else if (this.record.dueDate) {

    } else if (this.record.paymentStatus) {

    } else if (this.record.addressLine1) {

    }

    else if (this.record.city) {

    } else if (this.record.country) {

    } else if (this.record.postalCode) {

    } else if (this.record.phoneNumber) {

    }

    else if (this.record.email) {

    } else if (this.record.currency) {

    } else if (this.record.dueAmount) {

    }

  }


}
