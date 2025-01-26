import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { paymentStatusOptions } from '../consts';
import { PaymentService } from '../services/payment.service';
import { Utils } from '../utils';
import { recordInterface, backendRecordInterface } from '../interfaces/edit.interface';
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { ActivatedRoute } from '@angular/router';
import { LocationService } from '../services/location.service';
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
  providers: [PaymentService, LocationService],
  templateUrl: './edit-payment.component.html',
  styleUrl: './edit-payment.component.css'
})
export class EditPaymentComponent implements OnInit {
  record: recordInterface = {} as recordInterface;
  paymentStatusOptions = paymentStatusOptions;
  invalidForm: boolean = false;

  countries: string[] = []; // Contains all the countries.
  states: string[] = []; // Contains all the states/provinces by country.
  cities: string[] = []; // Contains all the cities by country.


  filteredCountries: string[] = [];
  showDropdownCountries = false;

  filteredStates: string[] = [];
  showDropdownStates = false;

  filteredCities: string[] = [];
  showDropdownCities = false;




  constructor(protected _utils: Utils,
    private _route: ActivatedRoute,
    private _router: Router,
    private _payService: PaymentService,
    private _locationService: LocationService) {

  }

  ngOnInit(): void {
    this._route.paramMap.subscribe(params => {
      const paymentId = params.get('id');
      this._payService.searchRecord({ paymentId: paymentId, mode: 'edit' }).subscribe({
        next: (response) => {
          this.record = this._utils.transformBackendPayloadToRecords(response.data)[0];
        },
        error: (error) => {
          console.error("Error in search:", error);
        },
        complete: () => {
          this._locationService.getCurrencies(this.record.country).subscribe({
            next: (response) => {
              if (!response.error) {
                this.record.currency = response.data.currency;
              }
            },
            error: (error) => {
              console.error("Error in Location service while fetching currency:", error);
            },
          });

          this._locationService.getStates(this.record.country).subscribe({
            next: (response) => {
              if (!response.error) {
                this.states = [];
                this.states = response.data.states.map((state: any) => state.name);
              }
            },
            error: (error) => {
              console.error("Error in Location service while fetching currency:", error);
            },
          });

          this._locationService.getCities(this.record.country, this.record.provinceOrState).subscribe({
            next: (response) => {
              if (!response.error) {
                this.cities = []
                this.cities = response.data;
              }
            },
            error: (error) => {
              console.error("Error in Location service while fetching currency:", error);
            },
          });
        },
      });
    });
    this._locationService.getCountries().subscribe({
      next: (response) => {
        this.countries = response.data.map((countryRecord: any) => countryRecord.Iso2);
      },
      error: (error) => {
        console.error("Error in Location Service:", error);
      },
      complete: () => {
      },
    });
  }

  updatePayment() {
    if (!this.record.hasOwnProperty('evidenceFile') && this.record.paymentStatus === "completed") {
      alert("Missing Proof of Payment. PaymentStatus can't be set to Completed!");
      return;
    }

    const payload: backendRecordInterface = this._utils.transformRecordToBackendPayload(this.record);
    this._payService.updateRecord(payload).subscribe({
      next: (response) => {
        setTimeout(() => {
          alert('Payment updated successfully!');
          this._router.navigate(['/']); // Redirect to main component
        }, 1000);
      },
      error: (error) => {
        console.error("Error occurred:", error);
      },
      complete: () => {
      },
    });
  }


  filterCountries(): void {
    const searchTerm = this.record.country.trim().toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredCountries = this.countries.filter((country) =>
        country.toLowerCase().includes(searchTerm)
      );
      this.showDropdownCountries = this.filteredCountries.length > 0;
    } else {
      this.showDropdownCountries = false;
    }
  }
  selectCountry(country: string): void {
    this.record.country = country;
    this.showDropdownCountries = false;

    this._locationService.getCurrencies(this.record.country).subscribe({
      next: (response) => {
        if (!response.error) {
          this.record.currency = response.data.currency;
        }
      },
      error: (error) => {
        console.error("Error in Location service while fetching currency:", error);
      },
    });

    this._locationService.getStates(this.record.country).subscribe({
      next: (response) => {
        if (!response.error) {
          this.states = [];
          this.states = response.data.states.map((state: any) => state.name);
          this.record.provinceOrState = "";
        }
      },
      error: (error) => {
        console.error("Error in Location service while fetching currency:", error);
      },
    });
  }

  hideDropdownWithDelayCountries(): void {
    setTimeout(() => {
      this.showDropdownCountries = false;
    }, 200);
  }

  // For Province/States
  filterStates(): void {
    const searchTerm = this.record.provinceOrState.trim().toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredStates = this.states.filter((state) =>
        state.toLowerCase().includes(searchTerm)
      );
      this.showDropdownStates = this.filteredStates.length > 0;
    } else {
      this.showDropdownStates = false;
    }
  }

  hideDropdownWithDelayStates(): void {
    setTimeout(() => {
      this.showDropdownStates = false;
    }, 200);
  }

  selectStates(state: string): void {
    this.record.provinceOrState = state;
    this.showDropdownStates = false;

    this._locationService.getCities(this.record.country, this.record.provinceOrState).subscribe({
      next: (response) => {
        if (!response.error) {
          this.cities = [];
          this.cities = response.data;
          this.record.city = "";
        }
      },
      error: (error) => {
        console.error("Error in Location service while fetching currency:", error);
      },
    });
  }

  // For City
  filterCities(): void {
    const searchTerm = this.record.city.trim().toLowerCase();
    if (searchTerm.length > 0) {
      this.filteredCities = this.cities.filter((state) =>
        state.toLowerCase().includes(searchTerm)
      );
      this.showDropdownCities = this.filteredCities.length > 0;
    } else {
      this.showDropdownCities = false;
    }
  }

  hideDropdownWithDelayCities(): void {
    setTimeout(() => {
      this.showDropdownCities = false;
    }, 200);
  }

  selectCities(city: string): void {
    this.record.city = city;
    this.showDropdownCities = false;
  }

  back = () => {
    this._router.navigate(['/']);
  }

  onFileChange(event: any) {
    this.record.evidenceFile = null;
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

}
