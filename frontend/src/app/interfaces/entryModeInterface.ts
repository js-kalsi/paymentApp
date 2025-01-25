export interface EntryMode {
  lot: string;
  base: string;
  killDate: string;
  billTo: string;
  owner: string;
  rfid: string;
  animal: string;
  weight: number | null;
  notes: string;
  breed: Set<string>;
  condemnation: Set<string>;
  sex: string;
  otm: string;
}

export interface Product {
  id: number;
  animal: string;
  class: string;
}

export interface OTMValues {
  name: string;
  value: string;
}
