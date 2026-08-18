// Refleja Contracts/ParkingStatuses/ParkingStatusDto.cs.
// MDParkingStatus lo alimenta el proceso de importación; la única escritura
// permitida desde la API es solicitar una importación diaria (ver el servicio).

export interface ParkingStatus {
  id: string;
  active: boolean;
  lastImported: string | null;
  lastImportedStatus: string | null;
  lastImportedOk: string | null;
  lastCountTotals: string | null;
  lastCountTotalsStatus: string | null;
  lastImportedDuration: string | null;
  // Del join con MDParking (mismo Id).
  parkingActive: boolean | null;
  parkingName: string | null;
  parkingType: string | null;
  parkingDacode: string | null;
  parkingServerIp: string | null;
  parkingJob: string | null;
  parkingLoadDate: string | null;
}
