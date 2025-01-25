export interface mainModeInterface {
    firstName: string,
    lastName: string
    paymentStatus: string;
    dueDate: string;
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
}

export interface recordInterface {
    id: string,
    name: string,
    paymentStatus: string;
    dueDate: string;
    dueAmount: number | null;
    address: string;
    phoneNumber: string;
    email: string;
    currency: string;
    discountPercent: number | null;
    taxPercent: number | null;
}
