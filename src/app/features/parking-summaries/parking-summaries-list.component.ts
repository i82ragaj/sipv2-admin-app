import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { finalize } from 'rxjs';
import { ParkingSummaryService } from '../../core/services/parking-summary.service';
import { ParkingSummary } from '../../core/models/parking-summary.model';
import { ParkingService } from '../../core/services/parking.service';
import { Parking } from '../../core/models/parking.model';

// DateOnly del backend serializa como 'yyyy-MM-dd': comparar/enviar como
// string es válido (ISO 8601 ordena igual lexicográfica que cronológicamente).
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Informe ERP: consulta de solo lectura sobre VParkingSummary (una fila por
// parking y día, con los totales/recuentos que alimenta el ERP). Filtrable
// por parking y rango de fechas; filtro, orden (más actuales primero) y
// paginación se resuelven en el servidor (ver ParkingSummariesController).
// Los filtros no se aplican solos: hay que pulsar "Buscar" una vez completados.
@Component({
  selector: 'app-parking-summaries-list',
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
  templateUrl: './parking-summaries-list.component.html',
  styleUrl: './parking-summaries-list.component.scss',
})
export class ParkingSummariesListComponent implements OnInit {
  private readonly parkingSummaryService = inject(ParkingSummaryService);
  private readonly parkingService = inject(ParkingService);

  // Página actual devuelta por el servidor (no todo el listado).
  readonly summaries = signal<ParkingSummary[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  readonly parkings = signal<Parking[]>([]);

  // Los controles de mat-select/matInput+matDatepicker necesitan un
  // ControlValueAccessor real (formControl) para registrarse como
  // MatFormFieldControl; con un [value]/(evento) suelto el form-field lanza
  // "must contain a MatFormFieldControl".
  readonly filtersForm = new FormGroup({
    parkingId: new FormControl<string | null>(null),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  // Nombre de parking por código, para mostrar "Código - Nombre" en el combo
  // de filtro (VParkingSummary solo trae el idpk, el nombre sale de /api/parkings).
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

  readonly displayedColumns = [
    'idpk',
    'date',
    'operations',
    'total',
    'cashTotal',
    'cashNum',
    'restTotal',
    'restNum',
    'invoiceNoMin',
    'invoiceNoMax',
  ];

  ngOnInit(): void {
    this.parkingService.getAll().subscribe((parkings) => this.parkings.set(parkings));
    this.load();
  }

  load(): void {
    const { parkingId, dateFrom, dateTo } = this.filtersForm.value;

    this.loading.set(true);
    this.parkingSummaryService
      .getPaged({
        parkingId,
        dateFrom: dateFrom ? toIsoDate(dateFrom) : null,
        dateTo: dateTo ? toIsoDate(dateTo) : null,
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((page) => {
        this.summaries.set(page.items);
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

  clearFilters(): void {
    this.filtersForm.reset();
    this.search();
  }
}
