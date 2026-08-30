import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyTotalService } from '../../core/services/daily-total.service';
import { DailyTotal } from '../../core/models/daily-total.model';

export interface DailyTotalsChartDialogData {
  parkingId: string;
  parkingLabel: string;
}

interface IncrementPoint {
  date: Date;
  amount: number;
  // Primera lectura del día: el incremento es el propio importe (desde 0),
  // no la diferencia con la última lectura del día anterior.
  isFirstOfDay: boolean;
}

interface Bar extends IncrementPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  // Límites del hueco completo asignado a este punto (no solo la barra
  // visible): con muchos puntos la barra puede quedar más fina que el hit
  // target recomendado de 24px, así que el área de hover/foco usa el hueco
  // entero en vez del ancho visible de la barra.
  slotX: number;
  slotWidth: number;
}

// Lienzo de diseño fijo (unidades de viewBox); el SVG se renderiza al 100%
// del ancho del diálogo y escala manteniendo esta proporción (como un
// <img>), así que nunca hace falta scroll horizontal — el ancho de cada
// barra se calcula a partir del nº de puntos para que quepan todas (ver
// `bars`). Con 760, el factor de escala real es ~1 para el ancho de diálogo
// (900px) usado en `openChart()`, así que el texto no queda ni minúsculo ni
// sobredimensionado.
const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 40;
const PADDING_LEFT = 64;
const PADDING_RIGHT = 16;
const BAR_MAX_WIDTH = 24;
// Fracción del hueco de cada barra que ocupa la barra en sí (el resto es el
// hueco entre barras); con muchos puntos (7 días de lecturas frecuentes) el
// hueco disponible por barra puede ser menor que BAR_MAX_WIDTH, y entonces
// manda este ratio en vez del máximo.
const BAR_WIDTH_RATIO = 0.7;

// VDailyTotal es un acumulado que se reinicia cada día: para que el
// "incremento horario" tenga sentido en los cambios de día, la primera
// lectura de cada día se trata como incremento desde 0 (su propio importe),
// no como diferencia con la última lectura del día anterior.
function computeHourlyIncrements(readings: DailyTotal[]): IncrementPoint[] {
  const points: IncrementPoint[] = [];
  let previousAmount: number | null = null;
  let previousDayKey: string | null = null;

  for (const reading of readings) {
    const date = new Date(reading.totalDate);
    const dayKey = reading.totalDate.slice(0, 10);
    const amount = reading.dailyTotalAmount ?? 0;
    const isFirstOfDay = dayKey !== previousDayKey;

    points.push({
      date,
      amount: isFirstOfDay ? amount : amount - (previousAmount ?? 0),
      isFirstOfDay,
    });

    previousAmount = amount;
    previousDayKey = dayKey;
  }

  return points;
}

// "Ver evolución": diálogo con la evolución del incremento horario de
// ingresos del parking seleccionado, desde 7 días antes de su último dato
// disponible (ver DailyTotalsController.GetSeries). Gráfico de barras propio
// en SVG, sin librería externa — una sola serie, un solo hue de marca.
@Component({
  selector: 'app-daily-totals-chart-dialog',
  standalone: true,
  imports: [DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './daily-totals-chart-dialog.component.html',
  styleUrl: './daily-totals-chart-dialog.component.scss',
})
export class DailyTotalsChartDialogComponent {
  readonly data = inject<DailyTotalsChartDialogData>(MAT_DIALOG_DATA);
  private readonly dailyTotalService = inject(DailyTotalService);

  readonly loading = signal(true);
  readonly points = signal<IncrementPoint[]>([]);
  readonly hoveredIndex = signal<number | null>(null);

  readonly dateRangeLabel = computed(() => {
    const pts = this.points();
    if (pts.length === 0) {
      return '';
    }
    const format = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${format(pts[0].date)} – ${format(pts[pts.length - 1].date)}`;
  });

  readonly maxAmount = computed(() => Math.max(0, ...this.points().map((p) => p.amount)));
  readonly minAmount = computed(() => Math.min(0, ...this.points().map((p) => p.amount)));

  // Techo/suelo del eje Y redondeados a un múltiplo "limpio", para que los
  // ticks no queden en números como 137.42.
  private niceStep(value: number): number {
    if (value <= 0) {
      return 0;
    }
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * magnitude;
  }

  readonly yMax = computed(() => {
    const raw = this.maxAmount();
    if (raw === 0) {
      return 1;
    }
    const step = this.niceStep(raw);
    return Math.ceil(raw / step) * step;
  });

  readonly yMin = computed(() => {
    const raw = Math.abs(this.minAmount());
    if (raw === 0) {
      return 0;
    }
    const step = this.niceStep(raw);
    return -Math.ceil(raw / step) * step;
  });

  readonly yTicks = computed(() => {
    const max = this.yMax();
    const min = this.yMin();
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      ticks.push(min + ((max - min) * i) / steps);
    }
    return ticks;
  });

  // Pública: la usa también la plantilla para posicionar gridlines/ticks.
  yToPixel(value: number): number {
    const max = this.yMax();
    const min = this.yMin();
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const ratio = (value - min) / (max - min || 1);
    return PADDING_TOP + plotHeight * (1 - ratio);
  }

  readonly baselineY = computed(() => this.yToPixel(0));

  readonly bars = computed<Bar[]>(() => {
    const zeroY = this.baselineY();
    const points = this.points();
    const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    // Ancho de barra derivado del hueco disponible por punto, no fijo: así
    // todas las barras caben en el ancho de diseño sin necesitar scroll,
    // aunque haya muchas lecturas en los 7 días.
    const slotWidth = points.length > 0 ? plotWidth / points.length : plotWidth;
    const barWidth = Math.max(1, Math.min(BAR_MAX_WIDTH, slotWidth * BAR_WIDTH_RATIO));
    const gap = slotWidth - barWidth;

    return points.map((point, index) => {
      const slotX = PADDING_LEFT + index * slotWidth;
      const x = slotX + gap / 2;
      const valueY = this.yToPixel(point.amount);
      const y = Math.min(valueY, zeroY);
      const height = Math.abs(valueY - zeroY);
      return { ...point, x, y, width: barWidth, height, slotX, slotWidth };
    });
  });

  readonly hoveredBar = computed(() => {
    const index = this.hoveredIndex();
    return index === null ? null : (this.bars()[index] ?? null);
  });

  // Solo se etiqueta la barra del máximo (regla de "label selectively"): el
  // resto de valores se leen en el eje o en el tooltip.
  readonly maxBarIndex = computed(() => {
    const pts = this.points();
    if (pts.length === 0) {
      return -1;
    }
    let best = 0;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].amount > pts[best].amount) {
        best = i;
      }
    }
    return best;
  });

  readonly chartWidth = CHART_WIDTH;
  readonly chartHeight = CHART_HEIGHT;
  readonly paddingLeft = PADDING_LEFT;
  readonly plotRight = CHART_WIDTH - PADDING_RIGHT;
  // Expuesto para la plantilla (los pipes/expresiones del template no ven el
  // objeto global `Math`).
  readonly Math = Math;

  constructor() {
    this.dailyTotalService.getSeries(this.data.parkingId).subscribe((readings) => {
      this.points.set(computeHourlyIncrements(readings));
      this.loading.set(false);
    });
  }

  formatTick(hourLabel: Date): string {
    return hourLabel.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  formatHour(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
