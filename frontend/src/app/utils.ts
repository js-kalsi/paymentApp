import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { recordInterface, backendRecordInterface } from './interfaces/edit.interface';

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


  unixTimestampToLocal = (
    timestamp: number,
    fullTimestamp: boolean = false,
    onlyDate: boolean = false
  ): string => {
    const date = new Date(timestamp * 1000);

    // Get the month name
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getMonth()];

    // Extract day, year, and time components
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Format hours and minutes for 12-hour time
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = String(minutes).padStart(2, "0");

    if (onlyDate) {
      return `${month} ${day}, ${year}`;
    }
    if (fullTimestamp) {
      return `${month} ${day}, ${year}, ${formattedHours}:${formattedMinutes} ${period}`;
    }
    return `${year}-${month}-${String(day).padStart(2, '0')}`;
  };



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


  transformBackendPayloadToRecords(backendData: any[]): recordInterface[] {
    return backendData.map(item => ({
      id: item._id,
      firstName: item.payee_first_name,
      lastName: item.payee_last_name,
      dueDate: item.payee_due_date,
      paymentStatus: item.payee_payment_status,
      addedDateUTC: item.payee_added_date_utc,
      addressLine1: item.payee_address.line_1,
      addressLine2: item.payee_address.line_2,
      city: item.payee_address.city,
      country: item.payee_address.country,
      provinceOrState: item.payee_address.province_or_state,
      postalCode: item.payee_address.postal_code,
      phoneNumber: item.payee_contact.phone_number,
      email: item.payee_contact.email,
      currency: item.currency,
      discountPercent: item.discount_percent || null,
      taxPercent: item.tax_percent || null,
      dueAmount: item.due_amount || null,
      totalDue: item.due_amount || null,
      evidenceFileURL: item.evidence_file_url
    }));
  }

  transformRecordToBackendPayload(record: any): backendRecordInterface {
    return {
      _id: record.id,
      payee_first_name: record.firstName,
      payee_last_name: record.lastName,
      payee_due_date: record.dueDate,
      payee_payment_status: record.paymentStatus,
      payee_added_date_utc: 12345,
      payee_address: {
        line_1: record.addressLine1,
        line_2: record.addressLine2,
        city: record.city,
        country: record.country,
        province_or_state: record.provinceOrState,
        postal_code: record.postalCode
      },
      payee_contact: {
        phone_number: record.phoneNumber,
        email: record.email
      },
      evidence_file: {
        file_data: record.evidenceFile?.fileData ?? null,
        file_name: record.evidenceFile?.fileName ?? null,
        content_type: record.evidenceFile?.contentType ?? null,
      },
      currency: record.currency,
      discount_percent: record.discountPercent,
      tax_percent: record.taxPercent,
      due_amount: record.dueAmount,
    }
  }


}
