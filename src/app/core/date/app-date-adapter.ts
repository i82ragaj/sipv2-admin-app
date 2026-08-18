import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

// NativeDateAdapter.parse() delega en `new Date(string)`, que interpreta
// "DD/MM/YYYY" como MM/DD/YYYY (o simplemente falla si el día > 12). Como la
// app muestra las fechas en DD/MM/YYYY (ver app.config.ts), el texto que el
// usuario escribe a mano debe interpretarse en ese mismo orden.
@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]) < 100 ? Number(match[3]) + 2000 : Number(match[3]);
        const date = new Date(year, month, day);
        // Rechaza fechas que "desbordan" (p.ej. 31/02 -> 3 de marzo).
        const isExactDate =
          date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
        return isExactDate ? date : null;
      }
    }
    return super.parse(value);
  }
}
