export interface searchRecordInterface {
    id: string
    firstName: string;
    lastName: string
    paymentStatus: string;
    dueDate: string;
    totalDue?: Number | null;
    addedDateUTC: number;
    evidenceFileUrl: string;
}
