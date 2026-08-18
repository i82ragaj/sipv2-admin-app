// Refleja Contracts/Parkings/*.cs (ParkingDto, CreateParkingRequest, UpdateParkingRequest)
// DateOnly -> string 'yyyy-MM-dd', TimeOnly -> string 'HH:mm:ss' al serializar con System.Text.Json.

// `type` es un código fijo de 3 valores (proveedor del hardware del parking).
export const PARKING_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'EQ', label: 'Equinsa' },
  { value: 'SD', label: 'Skidata' },
  { value: 'MY', label: 'Meypar' },
];

export function parkingTypeLabel(type: string): string {
  return PARKING_TYPES.find((t) => t.value === type)?.label ?? type;
}

// `frecuency` es otro código fijo (frecuencia de importación del parking).
export const PARKING_FREQUENCIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'N', label: 'Normal' },
  { value: 'A', label: 'Alta' },
];

export function parkingFrequencyLabel(frecuency: string | null): string {
  if (!frecuency) {
    return '—';
  }
  return PARKING_FREQUENCIES.find((f) => f.value === frecuency)?.label ?? frecuency;
}

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
