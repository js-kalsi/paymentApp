export interface ProductInterface {
  id: number;
  cp: number;
  class: string,
  animal: string,
}

export interface PaymentInterface {
  "animal": string;
  "id": number;
  "list_price": number;
  "lot": number;
  "notes": string;
  "owner": string;
  "retail_price": number;
  "rfid": string;
  "weight": number;
  "billed"?: number;
  "total"?: number;
}
