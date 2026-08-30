import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { DailyTotalService } from '../../core/services/daily-total.service';
import { DailyTotal } from '../../core/models/daily-total.model';
import { ParkingService } from '../../core/services/parking.service';
import { Parking } from '../../core/models/parking.model';
import { DailyTotalsChartDialogComponent } from './daily-totals-chart-dialog.component';

// DateOnly del backend serializa como 'yyyy-MM-dd': comparar/enviar como
// string es válido (ISO 8601 ordena igual lexicográfica que cronológicamente).
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Ingresos Diarios: consulta de solo lectura sobre VDailyTotal (una fila por
// parking y día, con el importe y el recuento de transacciones del día).
// Filtrable por parking y rango de fechas; filtro, orden (más actuales
// primero) y paginación se resuelven en el servidor (ver DailyTotalsController).
// Los filtros no se aplican solos: hay que pulsar "Buscar" una vez completados.
@Component({
  selector: 'app-daily-totals-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './daily-totals-list.component.html',
  styleUrl: './daily-totals-list.component.scss',
})
export class DailyTotalsListComponent implements OnInit {
  private readonly dailyTotalService = inject(DailyTotalService);
  private readonly parkingService = inject(ParkingService);
  private readonly dialog = inject(MatDialog);

  // Página actual devuelta por el servidor (no todo el listado).
  readonly totals = signal<DailyTotal[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  readonly parkings = signal<Parking[]>([]);

  // parkingId es obligatorio: siempre debe haber un parking seleccionado (ver
  // ngOnInit y clearFilters, que lo preseleccionan al primero en orden
  // alfabético); a diferencia de Informe ERP, aquí no hay opción "Todos".
  readonly filtersForm = new FormGroup({
    parkingId: new FormControl<string | null>(null, Validators.required),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  // Nombre de parking por código, para mostrar "Código - Nombre" en el combo
  // de filtro (VDailyTotal solo trae el idpk, el nombre sale de /api/parkings).
  readonly parkingOptions = computed(() =>
    this.parkings()
      .map((p) => ({
        id: p.id,
        label: p.name ? `${p.id} - ${p.name}` : p.id,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly displayedColumns = ['idpk', 'totalDate', 'dailyTotalAmount'];

  ngOnInit(): void {
    // El primer listado espera a tener los parkings para poder preseleccionar
    // uno (siempre debe haber un parking elegido); no se dispara en paralelo.
    this.parkingService.getAll().subscribe((parkings) => {
      this.parkings.set(parkings);
      this.filtersForm.controls.parkingId.setValue(this.parkingOptions()[0]?.id ?? null);
      this.load();
    });
  }

  load(): void {
    const { parkingId, dateFrom, dateTo } = this.filtersForm.value;

    this.loading.set(true);
    this.dailyTotalService
      .getPaged({
        parkingId,
        dateFrom: dateFrom ? toIsoDate(dateFrom) : null,
        dateTo: dateTo ? toIsoDate(dateTo) : null,
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((page) => {
        this.totals.set(page.items);
        this.totalCount.set(page.totalCount);
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  // Aplica los filtros actuales del formulario: vuelve a la primera página
  // y consulta al servidor. Los filtros no se aplican solos al cambiarlos.
  search(): void {
    this.pageIndex.set(0);
    this.load();
  }

  // A diferencia de otros listados, "Limpiar filtros" no vacía el parking:
  // siempre debe quedar uno seleccionado, así que vuelve al primero alfabético.
  clearFilters(): void {
    this.filtersForm.reset({
      parkingId: this.parkingOptions()[0]?.id ?? null,
      dateFrom: null,
      dateTo: null,
    });
    this.search();
  }

  // Evolución del incremento horario del parking actualmente filtrado, desde
  // 7 días antes de su último dato disponible (ver DailyTotalsController.GetSeries).
  openChart(): void {
    const parkingId = this.filtersForm.controls.parkingId.value;
    if (!parkingId) {
      return;
    }
    const parkingLabel = this.parkingOptions().find((o) => o.id === parkingId)?.label ?? parkingId;

    this.dialog.open(DailyTotalsChartDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { parkingId, parkingLabel },
    });
  }
}
