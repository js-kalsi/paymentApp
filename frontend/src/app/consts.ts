// const apiURL: string = 'http://127.0.0.1:8000';
const apiURL: string = 'http://13.58.54.197:8000';
const PAGINATION_SEARCH_LIMIT: number = 10;

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
    PAGINATION_SEARCH_LIMIT,
};
