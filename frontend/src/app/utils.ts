import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ElementRef, QueryList } from '@angular/core';
import autoTable from "jspdf-autotable";

export class Utils {
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor() {
  }

  handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server-side error: ${error.status} - ${error.message}`;
    }

    console.error(errorMessage);

    // Return a user-friendly error message
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }


  /**
   * Converts a local date string (YYYY-MM-DD) to a Unix timestamp (seconds since epoch).
   * @param date - A local date string in the format 'YYYY-MM-DD'. Defaults to the current date/time if not provided.
   * @returns The Unix timestamp corresponding to the provided date.
   */
  localToUnixTimestamp = (date: string = ''): number => {
    if (date !== '') {
      const [year, month, day] = date.split("-");
      const todayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return Math.floor(todayDate.getTime() / 1000);
    }
    return Math.floor(new Date().getTime() / 1000);
  }


  unixTimestampToLocal = (timestamp: number, fullTimestamp: boolean = false, onlyDate: boolean = false): string => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0'); // ensure 2 digits for day
    if (onlyDate) return `${this.months[date.getMonth()]} ${day} ${year}`;
    if (fullTimestamp) return date.toString().split('GMT-')[0];
    return `${year}-${month}-${day}`;
  };


  printPDFFromBlob(pdfUrl: string): void {
    fetch(pdfUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);

        // Open in a new tab
        const newTab = window.open(blobUrl, '_blank');

        if (newTab) {
          newTab.onload = () => {
            newTab.print();
          };
        } else {
          console.error('Failed to open new tab.');
        }
      })
      .catch((error) => console.error('Error fetching PDF:', error));
  }

  getUTCRangeByDate(date: string = 'today', timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): {
    start: number,
    end: number
  } {
    let startOfDay;
    if (date !== 'today') {
      const [year, month, day] = date.split("-");
      startOfDay = new Date(`${month}-${day}-${year}`)
    } else {
      startOfDay = new Date();
    }


    // Set start time to 00:00:00 and end time to 23:59:59 in the local timezone
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Use `toISOString` to get UTC times directly
    const startInUTC = new Date(startOfDay.toISOString());
    const endInUTC = new Date(endOfDay.toISOString());

    // Return timestamps in seconds
    return {
      start: Math.floor(startInUTC.getTime() / 1000),
      end: Math.floor(endInUTC.getTime() / 1000)
    };
  }


  isEmptyStr = (value: string) => (value == null || value.trim().length === 0);

  changeDateFormat = (dateString: string): string => {
    const date = new Date(dateString);

    // Format the date to yyyy-mm-dd
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  /**
   * @returns Returns date in  (YYYY-MM-DD) format.
   */
  getTodaysDate = () => {
    const todayDate = new Date();
    const currentYear = todayDate.getFullYear();
    const currentMonth = todayDate.getMonth() + 1;
    const currentDay = todayDate.getDate();

    const finalDay = currentDay >= 10 ? currentDay : `0${currentDay}`;
    const finalMonth = currentMonth >= 10 ? currentMonth : `0${currentMonth}`;
    return `${currentYear}-${finalMonth}-${finalDay}`;
  };


  getCurrentAndFutureDate(): { currentDate: string; futureDate: string } {
    const today = new Date();

    // Calculate one month in the future
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 1);

    // Ensure the date doesn't overflow (e.g., Jan 31 + 1 month becomes Mar 3)
    if (futureDate.getDate() !== today.getDate()) {
      futureDate.setDate(0); // Set to the last day of the previous month
    }

    // Format dates as 'yyyy-MM-dd'
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      currentDate: formatDate(today),
      futureDate: formatDate(futureDate),
    };
  }

  // Function to split payRecords into chunks of 32 records each
  chunkRecords(records: any[], chunkSize: number) {
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }
    return chunks;
  }


  generatePDFForSearchResult(tableContainer: ElementRef, tableElements: QueryList<ElementRef>) {
    const tableDiv = tableContainer.nativeElement;
    const logoSrc = './images/logo.png';
    const watermarkSrc = './images/logobg.png';
    if (!tableDiv) return;
    tableDiv.hidden = false;
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.setFont("helvetica");

    setTimeout(() => {
      const pdfPromises = tableElements.map((tableElement, index) =>
        html2canvas(tableElement.nativeElement, { scale: 1 }) // Lower scale for smaller canvas size
          .then((canvas) => {
            if (index > 0) pdf.addPage();
            // Convert the content to a compressed image
            const contentImg = canvas.toDataURL('image/jpeg', 0.6); // JPEG format with 60% quality

            // Get PDF dimensions
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Add the logo at the top
            const logoWidth = 22; // Adjust width as needed
            const logoHeight = 25; // Adjust height as needed
            pdf.addImage(logoSrc, 'JPEG', 10, 10, logoWidth, logoHeight);

            // Add the content below the logo
            const contentY = 10 + logoHeight; // Position content below logo
            const contentWidth = pdfWidth - 20; // Adjust for margins
            const contentHeight = (canvas.height * contentWidth) / canvas.width;
            pdf.addImage(contentImg, 'JPEG', 10, contentY, contentWidth, contentHeight);

            // Add the watermark on top
            const watermarkWidth = 50; // Adjust watermark width
            const watermarkHeight = 70; // Adjust watermark height
            const watermarkX = (pdfWidth - watermarkWidth) / 2;
            const watermarkY = (pdfHeight - watermarkHeight) / 2;

            // Set transparency for the watermark
            pdf.saveGraphicsState();
            pdf.setGState(new (pdf.GState as any)({ opacity: 0.2 })); // Set 20% opacity
            pdf.addImage(watermarkSrc, 'JPEG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, "watermark", 'FAST');
            pdf.restoreGraphicsState();
          })
          .catch((error) => {
            console.error('Error generating PDF:', error);
          })
      );
      Promise.all(pdfPromises).then(() => {
        // pdf.save("farmreport.pdf");
        tableDiv.hidden = true;
      });
    }, 50);
    return pdf;
  }



  generatePDF(tableHead: any, tableBody: any) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const logoImagePath = "./images/logo.png";
    const watermarkImagePath = "./images/logobg.png";

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
      });
    };

    Promise.all([loadImage(logoImagePath), loadImage(watermarkImagePath)])
      .then(([logoImg, watermarkImg]) => {
        const logoHeight = 25;
        const logoY = 10;
        const spacingAfterLogo = 2;
        autoTable(doc, {
          margin: { top: logoY + logoHeight + spacingAfterLogo },
          head: tableHead,
          body: tableBody,
          styles: { fontSize: 7, },
          didDrawPage: (data) => {
            doc.addImage(logoImg, "JPEG", 10, logoY, 25, logoHeight);
            doc.saveGraphicsState();
            doc.setGState(new (doc.GState as any)({ opacity: 0.25 }));
            doc.addImage(watermarkImg, "JPEG", 110, 65, 75, 90);
            doc.restoreGraphicsState();
          },
        });
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      })
      .catch((err) => {
        console.error("Error loading images:", err);
      });
  }

}
