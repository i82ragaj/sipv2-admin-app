import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, interval } from 'rxjs';
import { OccupancyService } from '../../core/services/occupancy.service';
import { CurrentOccupancy } from '../../core/models/current-occupancy.model';

const REFRESH_INTERVAL_MS = 60_000;

export type OccupancyViewMode = 'datos' | 'grafica';

// Severidad del medidor de la vista "Gráfica": rojo/naranja/verde según el
// % de ocupación, igual que un semáforo (no es un estado bueno/malo de la
// petición, es la lectura directa de cuán lleno está el parking). Colores
// fijos del sistema de estado (nunca se theman, ver dataviz skill).
export type OccupancyStatus = 'critical' | 'warning' | 'good';

// percentage null (contador sin capacidad configurada) se trata aparte en la
// plantilla, sin barra de color: no hay "%" con el que decidir un umbral.
export function occupancyStatus(percentage: number): OccupancyStatus {
  if (percentage < 50) {
    return 'critical';
  }
  if (percentage < 75) {
    return 'warning';
  }
  return 'good';
}

// Ocupación Actual: foto en tiempo real de VOccupationActual (un contador por
// fila, con su nivel/capacidad actuales). No hay paginación ni filtro: es el
// estado vivo de todos los contadores agregados ("Todos", ver
// OccupancyController), y se refresca solo cada minuto (además del botón
// manual) para que la pantalla sirva como monitor sin intervención.
@Component({
  selector: 'app-occupancy-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './occupancy-list.component.html',
  styleUrl: './occupancy-list.component.scss',
})
export class OccupancyListComponent implements OnInit {
  private readonly occupancyService = inject(OccupancyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly occupancy = signal<CurrentOccupancy[]>([]);
  readonly loading = signal(false);

  // "Datos" (tabla) / "Gráfica" (medidores por parking, vista por defecto).
  readonly viewMode = signal<OccupancyViewMode>('grafica');

  // Expuesto para la plantilla.
  readonly occupancyStatus = occupancyStatus;

  // Por debajo de este % el relleno no tiene sitio para el texto ("1.9%" no
  // cabe dentro de una barra al 1.9%): la etiqueta se saca fuera, a la
  // derecha, en vez de solaparse o recortarse (ver marks-and-anatomy.md).
  labelFitsInsideBar(percentage: number): boolean {
    return percentage >= 20;
  }

  // El dato real puede traer un nivel negativo (glitch de sensor/contador) o
  // por encima de la capacidad configurada; un width negativo en CSS es
  // inválido y el navegador lo ignora (el div cae a su ancho por defecto:
  // ~100%, una barra roja llena engañosa), así que se acota a [0, 100] antes
  // de usarlo como ancho.
  clampPercentage(percentage: number): number {
    return Math.min(100, Math.max(0, percentage));
  }

  readonly displayedColumns = [
    'parkingId',
    'counterCode',
    'counterName',
    'currentLevel',
    'capacity',
    'percentage',
    'updated',
  ];

  ngOnInit(): void {
    this.load();

    // No usa startWith: la primera carga ya la hace el load() de arriba, así
    // que el intervalo solo dispara las recargas automáticas siguientes.
    interval(REFRESH_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.occupancyService
      .getCurrent()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((occupancy) => this.occupancy.set(occupancy));
  }
}
