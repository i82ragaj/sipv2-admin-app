// Refleja Contracts/Occupancy/CurrentOccupancyDto.cs.
// Solo lectura: VOccupationActual es una vista, no se edita desde la API.

export interface CurrentOccupancy {
  parkingId: string;
  parkingName: string | null;
  counterId: string;
  counterCode: string;
  counterName: string | null;
  capacity: number | null;
  currentLevel: number;
  percentage: number | null;
  updated: string | null;
}
