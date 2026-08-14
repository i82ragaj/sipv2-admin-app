// Refleja Contracts/ParkingStatuses/ParkingStatusDto.cs.
// Solo lectura: MDParkingStatus lo alimenta el proceso de importación, no se edita desde la API.

export interface ParkingStatus {
  id: string;
  active: boolean;
  lastImported: string | null;
  lastImportedStatus: string | null;
  lastImportedOk: string | null;
  lastCountTotals: string | null;
  lastCountTotalsStatus: string | null;
  lastImportedDuration: string | null;
}
