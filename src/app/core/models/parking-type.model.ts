// Refleja Contracts/ParkingTypes/ParkingTypeDto.cs.
// Catálogo de tipos de parking (antes una constante fija de 3 valores en el
// front, ahora en MDParkingType). Solo lectura desde esta API.

export interface ParkingType {
  id: string;
  name: string | null;
  description: string | null;
  active: boolean;
}

// Etiqueta de un tipo a partir de su id y la lista cargada; si el tipo no
// aparece en la lista (p.ej. inactivo y filtrado en otra pantalla), cae al
// propio id en vez de dejar la celda vacía.
export function parkingTypeLabel(typeId: string, types: ParkingType[]): string {
  return types.find((t) => t.id === typeId)?.name ?? typeId;
}
