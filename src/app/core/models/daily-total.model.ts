// Refleja Contracts/DailyTotals/DailyTotalDto.cs.
// Solo lectura: VDailyTotal es una vista, no se edita desde la API.

export interface DailyTotal {
  idpk: string;
  totalDate: string;
  dailyTotalAmount: number | null;
  dailyTransWithPay: number | null;
  dailyTransWithOutPay: number | null;
}
