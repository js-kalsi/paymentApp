type Base64 = string;

export interface recordInterface {
    id: string
    firstName: string;
    lastName: string
    paymentStatus: string;
    dueDate: string;
    addedDateUTC: number;
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
    provinceOrState: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    currency: string;
    discountPercent: number | null;
    taxPercent: number | null;
    dueAmount: number | null;
    totalDue?: Number | null;
    evidenceFileURL: string | null,
    evidenceFile?: {
        fileData?: Base64 | null,
        fileName?: string | null,
        contentType?: string | undefined | null,
    } | null;
}

export interface backendRecordInterface {
    _id: string;
    payee_first_name: string;
    payee_last_name: string;
    payee_due_date: string;
    payee_payment_status: string;
    payee_added_date_utc: number;
    payee_address: {
        line_1: string;
        line_2: string;
        city: string;
        country: string;
        province_or_state: string;
        postal_code: string;
    },
    payee_contact: {
        phone_number: string;
        email: string;
    },
    evidence_file: {
        file_data: Base64 | null,
        file_name: string | null,
        content_type?: string | null,
    },
    currency: string;
    discount_percent: number | null;
    tax_percent: number | null;
    due_amount: number | null;
}


export interface CountryRecord {
    Iso2: string;
    name: string;
}