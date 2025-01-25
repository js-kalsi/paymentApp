import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NgForOf, NgIf } from "@angular/common";
import { NgxBarcode6Module } from "ngx-barcode6";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Utils } from '../utils';
import { Router } from '@angular/router';



@Component({
    selector: 'app-print-pdf',
    standalone: true,
    imports: [
        NgForOf,
        NgxBarcode6Module,
        NgIf,
    ],
    templateUrl: './print-pdf.component.html',
    styleUrl: './print-pdf.component.css'
})
export class PrintPdfComponent {
    isDataAvailable: boolean = false;
    tableRecords: any = [];
    serialNumber: number = 0;
    showHead: boolean = false;
    @ViewChild('tableContainer') tableContainer!: ElementRef;
    @ViewChildren('tableElements') tableElements!: QueryList<ElementRef>;

    constructor(protected _utils: Utils, private _router: Router) {
    }

    generateEntryPDF = (entryModeData: {
        id: number,
        sno: number,
        owner: string;
        lot: string;
        notes: string;
        killDate: string;
        billTo: string;
        animal: string;
        weight: number | null;
        otm: string;
        rfid: string;
        base: string | undefined;
        condemnation: string;
        sex: string;
        breed: string;
    }, sourcePage: string) => {
        try {
            if (["Lamb", "Sheep", "Goat"].includes(entryModeData.animal)) {
                for (let i = 0; i < Number(entryModeData.weight); i++) {
                    this.tableRecords.push({
                        owner: entryModeData.owner,
                        billTo: entryModeData.billTo,
                        lot: entryModeData.lot,
                        killDate: entryModeData.killDate,
                        sno: (entryModeData.sno + Number(entryModeData.base || 0)).toString().padStart(4, '0'),
                        animal: entryModeData.animal,
                        rfid: entryModeData.rfid,
                        notes: entryModeData.notes,
                        weight: `${i + 1} of ${entryModeData.weight}`,
                        otm: entryModeData.otm,
                        breed: entryModeData.breed,
                        sex: entryModeData.sex,
                        condemnation: entryModeData.condemnation

                    });
                }
            } else {
                for (let i = 0; i < 2; i++) {
                    this.tableRecords.push({
                        owner: entryModeData.owner,
                        billTo: entryModeData.billTo,
                        lot: entryModeData.lot,
                        killDate: entryModeData.killDate,
                        sno: (entryModeData.sno + Number(entryModeData.base || 0)).toString().padStart(4, '0'),
                        animal: entryModeData.animal,
                        rfid: entryModeData.rfid,
                        notes: entryModeData.notes,
                        weight: entryModeData.weight,
                        otm: entryModeData.otm,
                        breed: entryModeData.breed,
                        sex: entryModeData.sex,
                        condemnation: entryModeData.condemnation
                    });
                }
            }
            const tableDiv = this.tableContainer.nativeElement;
            setTimeout(() => {
                tableDiv.hidden = false;
                const pdf = new jsPDF('l', 'in', 'a4');
                pdf.setFont("helvetica");

                const pdfPromises = this.tableElements.map((tableElement, index) =>
                    html2canvas(tableElement.nativeElement, { scale: 1 }).then((canvas) => {
                        if (index > 0) pdf.addPage();
                        pdf.addImage(canvas.toDataURL('image/PNG'), 'PNG', 3, 1, 6, 6);

                    })
                );

                Promise.all(pdfPromises).then(() => {
                    const pdfBlob = pdf.output('blob'); // Get the PDF as a blob
                    const pdfUrl = URL.createObjectURL(pdfBlob); // Create a blob URL for the PDF

                    // Open the PDF in a new window for print preview
                    const printWindow = window.open(pdfUrl, '_blank');
                    if (printWindow) {
                        printWindow.focus(); // Focus on the new window
                        printWindow.print(); // Trigger the print dialog
                    }

                    // Hide the table again after generating the PDF
                    tableDiv.hidden = true;

                    this._router.navigateByUrl(`/${sourcePage}`).then(() => {
                        window.location.reload(); // Forces a full page reload
                    });
                });
            }, 50);
            console.log("I m here inside generatePDF!!!");

        } catch (error) {
            console.log("Error occured generateEntryPDF:", error);

        }
    };


}