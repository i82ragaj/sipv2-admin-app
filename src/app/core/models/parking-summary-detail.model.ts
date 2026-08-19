// Refleja Contracts/ParkingSummaries/ParkingSummaryDetailDto.cs.
// Desglose por tipo de pago de una fila de ParkingSummary. Solo lectura.

export interface ParkingSummaryDetail {
  paymentTypeId: string | null;
  paymentTypeName: string | null;
  operations: number | null;
  total: number | null;
  discount: number | null;
}
