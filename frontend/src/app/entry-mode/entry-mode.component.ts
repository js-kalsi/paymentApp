import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { EntryMode, OTMValues, } from "../interfaces/entryModeInterface";
import { PrintPdfComponent } from '../print-pdf/print-pdf.component';
import { RecordsService } from "../services/record.service";
import { SessionService } from '../services/session-service';

import { apiURL } from '../consts';
import { Utils } from "../utils";
import { Router } from '@angular/router';


import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";

@Component({
  selector: "app-entry-mode",
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, NgForOf, PrintPdfComponent],
  providers: [RecordsService, SessionService],
  templateUrl: "./entry-mode.component.html",
  styleUrl: "./entry-mode.component.css",
})
export class EntryModeComponent implements OnInit, AfterViewInit {
  apiURL = apiURL;
  entryMode: EntryMode = {
    lot: "",
    base: "0000",
    killDate: "",
    billTo: "",
    owner: "",
    rfid: "",
    animal: "",
    weight: null,
    notes: "NA",
    breed: new Set() as Set<string>,
    condemnation: new Set() as Set<string>,
    sex: "",
    otm: "",
  };
  showDivs: boolean[] = [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];
  enableSubmitBtn: boolean = false;
  editMode: boolean = false;
  counter: number = 0;
  progressValue: number = 9.09;
  activeAnimalButtonIndex: number = -1;
  activeSexButtonIndex: number | null = null;
  animalButtons: string[] = [
    "Bovine(Beef) [B]",
    "Bovine(Veal) [V]",
    "Lamb [L]",
    "Sheep [A]",
    "Goat [G]",
    "Bison [O]",
    "Deer [D]",
    "Elk [E]",
    "Buffalo [F]",
  ];
  breedButtons: string[] = [
    "Black [B]",
    "Red [R]",
    "Hols [H]",
    "HolsX [O]",
    "Tan [T]",
    "Herf [F]",
    "Cross [C]",
    "Jers [J]",
    "Grey [G]",
    "Char [A]",
    "Baldie [L]",
    "B/W [W]",
    "Speck [E]",
    "Wagyu [Y]",
    "Gallo [K]",
    "Shrt Hrn [Q]",
    "Lng Hrn [I]",
    "White [M]",
    "Boer [U]",
  ];
  sexButtons: string[] = ['Steer [A]', 'Heifer [H]', 'Bull [B]', 'Cow [C]', 'VCM [V]', 'VCF [F]', 'HCM [M]', 'HCF [O]'];
  condemnationButtons: string[] = [
    "Lungs [L]",
    "Liver [I]",
    "Kidney [K]",
    "Heart [H]",
    "Tongue [T]",
    "Spleen [M]",
    "Excess Trim [E]",
    "Heavy Tag [A]",
    "Parts Condemned [R]",
    "Whole Condemned [W]",
    "Undeclared [U]",
  ];
  otmValues: OTMValues[] = [];
  inValidWeight: boolean = false;
  isValid: boolean[] = [
    true,
    false,
    false,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ];
  skipHead: boolean = false;

  owners: string[] = []; // Contains all the owners from the database.
  filteredOwners: string[] = [];
  showDropdown = false;
  enableReloadBtn = false;
  validRFID = true;


  @ViewChild('rfid') rfidElement!: ElementRef;
  @ViewChild('killDate') killDateElement!: ElementRef;
  @ViewChild('weightHead') weightHeadElement!: ElementRef;
  @ViewChild('owner') ownerElement!: ElementRef;
  @ViewChild('notes') notesElement!: ElementRef;
  @ViewChild(PrintPdfComponent) printPDF!: PrintPdfComponent;

  constructor(
    private _recordsService: RecordsService,
    protected _utils: Utils,
    private _router: Router,
    private _sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    this._recordsService.getDataFromEntries().subscribe({
      next: (response) => {
        this.entryMode.lot = response.maxLot + 1;
        this.entryMode.killDate = this._utils.unixTimestampToLocal(response.killDate);
        this.entryMode.owner = response.owner;
        this.entryMode.billTo = response.billTo;
        this.entryMode.animal = response.animal;
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
    this.entryMode.base = this._sessionService.getBase() || "0000";
    this._sessionService.setMode('entry');
  }


  ngAfterViewInit(): void {
    this.onFocus();
  }

  prev = () => {
    // Need to reset weight/head and set inValidWeight to false
    if (this.counter == 3) {
      this.entryMode.weight = null;
      this.inValidWeight = false;
      this.isValid[this.counter] = false;
    }
    if (this.counter === 6) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.breed.size != 0;
      }
    }
    if (this.counter === 7) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.sex !== "";
      }
    }

    this.counter -= 1;
    this.progressValue -= 9.09;
    this.showDivs.fill(false);
    this.showDivs[this.counter] = true;
    this.enableSubmitBtn = !(this.counter < 11);
    this.onFocus()
  };

  next = () => {
    if (this.counter === 1) {
      if (this.entryMode.rfid.length > 15) {
        if (!confirm("RFID is greater than 15 digits. Do you want to continue?")) {
          this.isValid[this.counter] = false;
          return;
        } else {
          this.isValid[this.counter] = true;
        }
      }
      if (this.entryMode.rfid.length < 15) {
        if (!confirm("RFID is smaller than 15 digits. Do you want to continue?")) {
          this.isValid[this.counter] = false;
          return;
        } else {
          this.isValid[this.counter] = true;
        }
      }
      if (!this.entryMode.rfid.startsWith('124000')) {
        if (!confirm("RFID doesn't start with 124000!")) {
          this.isValid[this.counter] = false;
          return;
        } else {
          this.isValid[this.counter] = true;
        }
      }
    }
    this.counter += 1;
    this.progressValue += 9.09;
    if (this.counter == 9 && this.skipHead) {
      this.counter += 1;
      this.progressValue += 9.09;
    }
    this.showDivs.fill(false);
    this.showDivs[this.counter] = true;
    this.enableSubmitBtn = this.counter == 10;
    this.onFocus();
    if (this.counter === 6) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.breed.size != 0;
      }
    }
    if (this.counter === 7) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.sex !== "";
      }
    }
  };

  showSummary = () => {
    this.showDivs.fill(false);
    this.counter = 10;
    this.showDivs[this.counter] = true;
    this.editMode = false;
    this.progressValue = 100;
    this.enableSubmitBtn = true;
  };

  @HostListener('document:keydown.control.shift.s', ['$event'])
  submit = () => {
    if (this.counter !== 10) return;
    const validationState: boolean = this.validateEntryMode(this.entryMode);
    if (validationState) {
      console.log("Saving data to the backend server!");
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
        breed: Array.from(this.entryMode.breed).join(","),
        condemnation: Array.from(this.entryMode.condemnation).join(","),
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
                    }, 'entry-mode');
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
  };

  // Breed Button related functionality
  toggleBreedButtonSelection = (button: string): void => {
    const breedName = this.formatEntryModeData(button);
    if (this.entryMode.breed.has(breedName)) this.entryMode.breed.delete(breedName);
    else this.entryMode.breed.add(breedName);
    this.validateEachEntry();
  };

  formatEntryModeData = (recordString: string): string => {
    const result = recordString.split(' [');
    return (result.length > 0) ? result[0] : recordString;
  };

  isBreedButtonSelected = (button: string): boolean => this.entryMode.breed.has(this.formatEntryModeData(button));

  // Condemnation Button related functionality
  toggleCondemnationButtonSelection = (button: string): void => {
    const condemnationName = this.formatEntryModeData(button);
    if (this.entryMode.condemnation.has(condemnationName)) this.entryMode.condemnation.delete(condemnationName);
    else this.entryMode.condemnation.add(condemnationName);
  };

  isCondemnationButtonSelected = (button: string): boolean => this.entryMode.condemnation.has(this.formatEntryModeData(button));

  selectAnimalButton = (index: number, value: string) => {
    this.activeAnimalButtonIndex = index;
    const v = value.split(' [');
    if (v.length > 0) this.entryMode.animal = v[0];
    else this.entryMode.animal = value;
    this.validateEachEntry();

    // Case: Animal = Lamb/Sheep/Goat (OTM will always be No)
    if (["Lamb", "Sheep", "Goat"].includes(this.entryMode.animal)) {
      this.otmValues = [{ name: "No [N}", value: "N" }];
      this.entryMode.otm = "N";
      this.skipHead = true;
    } else {
      this.otmValues = [
        { name: "Yes [Y]", value: "Y" },
        { name: "No [N]", value: "N" },
      ];
      this.entryMode.otm = "";
      this.skipHead = false;
    }
  };

  selectSexButton = (index: number, value: string) => {
    this.activeSexButtonIndex = index;
    const v = value.split(' [');
    if (v.length > 0) this.entryMode.sex = v[0];
    else this.entryMode.sex = value;
    this.validateEachEntry();
  };

  edit = (counter: number) => {
    this.counter = counter;
    this.showDivs.fill(false);
    this.showDivs[this.counter] = true;
    this.enableSubmitBtn = this.counter == 10;
    this.editMode = true;
    this.progressValue = 50;
  };

  getRecordsAsString = (records: any): string => Array.from(records).join(", ");

  validateEntryMode = (data: EntryMode) => {
    if (data.rfid === "") {
      alert("Enter RFID!");
      return false;
    } else if (data.weight == null) {
      alert("Enter Head/Weight!");
      return false;
    } else if (data.otm === "") {
      alert("Enter OTM!");
      return false;
    } else if (["Bovine(Beef)", "Bovine(Veal)"].includes(data.animal)) {
      if (data.breed.size === 0) {
        alert("Enter Breed!");
        return false;
      }
      if (data.sex === "") {
        alert("Enter Sex!");
        return false;
      }
    }
    return true;
  };

  validateEachEntry = () => {
    console.log("this.counter === 6 :>", this.counter === 6, this.counter)
    if (this.counter === 1) {
      this.validateRFID();
    } else if (this.counter === 2) {
      this.isValid[this.counter] = this.entryMode.animal !== "";
    } else if (this.counter === 3) {
    } else if (this.counter === 6) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.breed.size != 0;
      }
    } else if (this.counter === 7) {
      if (["Bovine(Beef)", "Bovine(Veal)"].includes(this.entryMode.animal)) {
        this.isValid[this.counter] = this.entryMode.sex !== "";
      }
    } else if (this.counter === 9) {
      this.isValid[this.counter] = this.entryMode.otm != null;
    }
  };

  validateWeight = () => {
    console.log("this.entryMode.weight :>", this.entryMode.weight)
    if (this.entryMode.weight === null) {
      console.log("I m inside if statement!!!!")
      this.inValidWeight = true;
      this.isValid[this.counter] = false;
      return;
    }

    this.isValid[this.counter] = true;
    console.log(" this.isValid[this.counter] :>", this.isValid[this.counter])
    const weight = Number(this.entryMode.weight);
    if (this.entryMode.animal === "Bovine(Veal)" && weight > 417) {
      this.isValid[this.counter] = false;
      this.inValidWeight = true;
      alert("Veal weight cannot be over 417 Kgs");
    } else this.inValidWeight = false;
  };

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

  setBase = (value: any) => {
    this.entryMode.base = this.entryMode.base.toString().padStart(4, '0');
    alert(`Base# Set to ${this.entryMode.base}`);
    this._sessionService.setBase(this.entryMode.base);
  };

  reloadPage = (): void => {
    window.location.reload();
  };

  @HostListener('document:keydown.control.shift.arrowleft', ['$event'])
  moveBackward(event: KeyboardEvent
  ) {
    if (this.counter > 0) this.prev();
  }

  @HostListener('document:keydown.control.shift.arrowright', ['$event'])
  moveForward(event: KeyboardEvent
  ) {
    if (this.isValid[this.counter]) this.next();
  }

  @HostListener('document:keydown.control.shift.a', ['$event'])
  handleAUp(event: KeyboardEvent) {
    if (this.counter === 7) this.selectSexButton(0, 'Steer [A]');
    if (this.counter === 2) this.selectAnimalButton(3, 'Sheep');
    if (this.counter === 6) this.toggleBreedButtonSelection('Char [A]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Heavy Tag [A]');
  }

  @HostListener('document:keydown.control.shift.b', ['$event'])
  handleBUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(0, 'Bovine(Beef)');
    if (this.counter === 6) this.toggleBreedButtonSelection('Black [B]');
    if (this.counter === 7) this.selectSexButton(2, 'Bull [B]');
  }

  @HostListener('document:keydown.control.shift.c', ['$event'])
  handleCUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Cross [C]');
    if (this.counter === 7) this.selectSexButton(3, 'Cow [C]');
  }

  @HostListener('document:keydown.control.shift.d', ['$event'])
  handleDUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(6, 'Deer [D]');
  }

  @HostListener('document:keydown.control.shift.e', ['$event'])
  handleEUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(7, 'Elk');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Excess Trim [E]');
    if (this.counter === 6) this.toggleBreedButtonSelection('Speck [E]');
  }

  @HostListener('document:keydown.control.shift.f', ['$event'])
  handleFUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(8, 'Buffalo');
    if (this.counter === 6) this.toggleBreedButtonSelection('Herf [F]');
    if (this.counter === 7) this.selectSexButton(5, 'VCF [F]');
  }

  @HostListener('document:keydown.control.shift.g', ['$event'])
  handleGUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(4, 'Goat');
    if (this.counter === 6) this.toggleBreedButtonSelection('Grey [G]');
  }

  @HostListener('document:keydown.control.shift.h', ['$event'])
  handleHUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Hols [H]');
    if (this.counter === 7) this.selectSexButton(1, 'Heifer [H]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Heart [H]');
  }

  @HostListener('document:keydown.control.shift.i', ['$event'])
  handleIUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Lng Hrn [I]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Liver [I]');
  }

  @HostListener('document:keydown.control.shift.j', ['$event'])
  handleJUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Jers [J]');
  }

  @HostListener('document:keydown.control.shift.k', ['$event'])
  handleKUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Gallo [K]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Kidney [K]');
  }

  @HostListener('document:keydown.control.shift.l', ['$event'])
  handleLUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(2, 'Lamb');
    if (this.counter === 6) this.toggleBreedButtonSelection('Baldie [L]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Lungs [L]');
  }

  @HostListener('document:keydown.control.shift.m', ['$event'])
  handleMUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('White [M]');
    if (this.counter === 7) this.selectSexButton(6, 'HCM [M]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Spleen [M]');
  }

  @HostListener('document:keydown.control.shift.n', ['$event'])
  handleNUp(event: KeyboardEvent) {
    if (this.counter === 9) this.entryMode.otm = "N";
    this.validateEachEntry();
  }

  @HostListener('document:keydown.control.shift.o', ['$event'])
  handleOUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(5, 'Bison');
    if (this.counter === 6) this.toggleBreedButtonSelection('HolsX [O]');
    if (this.counter === 7) this.selectSexButton(7, 'HCF [O]');
  }

  @HostListener('document:keydown.control.shift.q', ['$event'])
  handleQUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Shrt Hrn [Q]');
  }

  @HostListener('document:keydown.control.shift.r', ['$event'])
  handleRUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Red [R]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Parts Condemned [R]');
  }

  @HostListener('document:keydown.control.shift.t', ['$event'])
  handleTUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Tan [T]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Tongue [T]');
  }

  @HostListener('document:keydown.control.shift.u', ['$event'])
  handleUUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Boer [U]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Undeclared [U]');
  }

  @HostListener('document:keydown.control.shift.v', ['$event'])
  handleVUp(event: KeyboardEvent) {
    if (this.counter === 2) this.selectAnimalButton(1, 'Bovine(Veal)');
    if (this.counter === 7) this.selectSexButton(4, 'VCM [V]');
  }

  @HostListener('document:keydown.control.shift.w', ['$event'])
  handleWUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('B/W [W]');
    if (this.counter === 8) this.toggleCondemnationButtonSelection('Whole Condemned [W]');
  }

  @HostListener('document:keydown.control.shift.y', ['$event'])
  handleYUp(event: KeyboardEvent) {
    if (this.counter === 6) this.toggleBreedButtonSelection('Wagyu [Y]');
    if (this.counter === 9) this.entryMode.otm = "Y";
    this.validateEachEntry();
  }

  onFocus = () => {
    if (this.counter === 0) setTimeout(() => this.killDateElement.nativeElement.focus(), 0);
    if (this.counter === 1) setTimeout(() => this.rfidElement.nativeElement.focus(), 0);
    if (this.counter === 3) setTimeout(() => this.weightHeadElement.nativeElement.focus(), 0);
    if (this.counter === 4) setTimeout(() => this.ownerElement.nativeElement.focus(), 0);
    if (this.counter === 5) setTimeout(() => this.notesElement.nativeElement.focus(), 0);
  }

  validateRFID = () => {
    if (!this.entryMode.rfid.length) {
      this.isValid[this.counter] = !(
        this.entryMode.rfid === "" || this.entryMode.rfid == null
      );
      return;
    }
    this._recordsService.checkIFRFIDExist(this.entryMode.rfid).subscribe({
      next: (response) => {
        console.log("Response for RFID:", response)
        if (response.success) {
          this.validRFID = true;
          this.isValid[this.counter] = true;
        }
        else {
          this.validRFID = false;
          this.isValid[this.counter] = false;
        }
      },
      error: (error) => console.error("Error occurred:", error),
      complete: () => {
      },
    });

  }

}
