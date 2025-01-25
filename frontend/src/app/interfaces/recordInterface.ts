export interface recordInterface {
  id: number;
  kill_date: number;
  rfid: string;
  owner: string;
  lot: string;
  eartag: string;
  type: string; //animal
  weight: string;
  otm: string;
  bill_to: string;
  base?: number;
  sex?: any;
  condemnation?: any;
  breed?: any;
}


export interface updateRecordInterface {
  id: number;
  kill_date: string;
  rfid: string;
  owner: string;
  lot: string;
  eartag: string;
  type: string; //animal
  class: string;
  weight: string;
  otm: string;
  bill_to: string;
  sex: any;
  breed?: any;
  condemnation?: any;
}

export interface searchRecordInterface {
  eartag: string,
  rfid: string,
  kill_date_from: string,
  kill_date_to: string,
  lot: string,
  owner: string,
  bill_to: string,
  otm: string,
}

