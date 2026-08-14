// Refleja Contracts/Parkings/*.cs (ParkingDto, CreateParkingRequest, UpdateParkingRequest)
// DateOnly -> string 'yyyy-MM-dd', TimeOnly -> string 'HH:mm:ss' al serializar con System.Text.Json.

export interface Parking {
  id: string;
  active: boolean;
  type: string;
  srv: string | null;
  name: string | null;
  company: string | null;
  dacode: string | null;
  dateFromTable: string | null;
  dateToTable: string | null;
  ndays: number | null;
  truncateTables: boolean | null;
  sii: boolean | null;
  multiCounter: boolean | null;
  serverIp: string | null;
  job: string | null;
  loadDate: string | null;
  frecuency: string | null;
}

export interface CreateParkingRequest {
  id: string;
  type: string;
  srv: string | null;
  name: string | null;
  company: string | null;
  dacode: string | null;
  dateFromTable: string | null;
  dateToTable: string | null;
  ndays: number | null;
  truncateTables: boolean | null;
  sii: boolean | null;
  multiCounter: boolean | null;
  serverIp: string | null;
  job: string | null;
  loadDate: string | null;
  frecuency: string | null;
}

export interface UpdateParkingRequest {
  active: boolean;
  type: string;
  srv: string | null;
  name: string | null;
  company: string | null;
  dacode: string | null;
  dateFromTable: string | null;
  dateToTable: string | null;
  ndays: number | null;
  truncateTables: boolean | null;
  sii: boolean | null;
  multiCounter: boolean | null;
  serverIp: string | null;
  job: string | null;
  loadDate: string | null;
  frecuency: string | null;
}
