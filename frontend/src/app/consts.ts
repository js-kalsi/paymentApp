const apiURL: string = 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE_FOR_RECORDS: number = 50;
const PAGINATION_SEARCH_LIMIT: number = 10;
const ITEMS_PER_PAGE_FOR_PAYMENT: number = 50;

const paymentStatusOptions: {
    key: string;
    value: string
}[] = [
        { key: "completed", value: "Completed" },
        { key: "due_now", value: "Due Now" },
        { key: "overdue", value: "Overdue" },
        { key: "pending", value: "Pending" },
    ];

export {
    apiURL,
    paymentStatusOptions,
    ITEMS_PER_PAGE_FOR_RECORDS,
    PAGINATION_SEARCH_LIMIT,
    ITEMS_PER_PAGE_FOR_PAYMENT,
};
