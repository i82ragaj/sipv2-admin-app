// Refleja Contracts/ParkingSummaries/ParkingSummaryDto.cs.
// Solo lectura: VParkingSummary es una vista, no se edita desde la API.

export interface ParkingSummary {
  id: string | null;
  idpk: string;
  date: string | null;
  operations: number | null;
  total: number | null;
  invoiceNoMin: string | null;
  invoiceNoMax: string | null;
  parkingTransTotal: number | null;
  parkingTransNum: number | null;
  sumMinutes: number | null;
  invoicesTotal: number | null;
  invoicesNum: number | null;
  acatotal: number | null;
  acanum: number | null;
  ceitotal: number | null;
  ceinum: number | null;
  certotal: number | null;
  cernum: number | null;
  cashTotal: number | null;
  cashNum: number | null;
  restTotal: number | null;
  restNum: number | null;
  discountTotal: number | null;
  discountNum: number | null;
}
