import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { finalize, forkJoin } from 'rxjs';
import { ParkingSummaryService } from '../../core/services/parking-summary.service';
import { ParkingSummary } from '../../core/models/parking-summary.model';
import { ParkingService } from '../../core/services/parking.service';
import { Parking } from '../../core/models/parking.model';

// DateOnly del backend serializa como 'yyyy-MM-dd': comparar como string es
// válido (ISO 8601 ordena igual lexicográfica que cronológicamente).
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Informe ERP: consulta de solo lectura sobre VParkingSummary (una fila por
// parking y día, con los totales/recuentos que alimenta el ERP). Filtrable
// por parking y rango de fechas; siempre ordenado por fecha.
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

  readonly summaries = signal<ParkingSummary[]>([]);
  readonly parkings = signal<Parking[]>([]);
  readonly loading = signal(false);

  // Los controles de mat-select/matInput+matDatepicker necesitan un
  // ControlValueAccessor real (formControl) para registrarse como
  // MatFormFieldControl; con un [value]/(evento) suelto el form-field lanza
  // "must contain a MatFormFieldControl". Los signals siguen siendo la
  // fuente de verdad para los computed de filtrado.
  readonly filtersForm = new FormGroup({
    parkingId: new FormControl<string | null>(null),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  readonly selectedParkingId = signal<string | null>(null);
  readonly dateFrom = signal<Date | null>(null);
  readonly dateTo = signal<Date | null>(null);

  // Nombre de parking por código, para mostrar "Código - Nombre" en el combo
  // de filtro (VParkingSummary solo trae el idpk, el nombre sale de /api/parkings).
  readonly parkingNamesById = computed(() => {
    const map = new Map<string, string | null>();
    for (const parking of this.parkings()) {
      map.set(parking.id, parking.name);
    }
    return map;
  });

  // Opciones del filtro de parking: los códigos que realmente aparecen en
  // los datos cargados, con su nombre para mostrar "Código - Nombre".
  readonly parkingOptions = computed(() => {
    const names = this.parkingNamesById();
    return Array.from(new Set(this.summaries().map((s) => s.idpk)))
      .sort()
      .map((idpk) => ({
        id: idpk,
        label: names.get(idpk) ? `${idpk} - ${names.get(idpk)}` : idpk,
      }));
  });

  readonly filteredSummaries = computed(() => {
    const parkingId = this.selectedParkingId();
    const from = this.dateFrom() ? toIsoDate(this.dateFrom()!) : null;
    const to = this.dateTo() ? toIsoDate(this.dateTo()!) : null;

    return this.summaries()
      .filter((s) => !parkingId || s.idpk === parkingId)
      .filter((s) => !from || (s.date ?? '') >= from)
      .filter((s) => !to || (s.date ?? '') <= to)
      // Más actuales primero.
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly pagedSummaries = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredSummaries().slice(start, start + this.pageSize());
  });

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

  constructor() {
    this.filtersForm.controls.parkingId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((parkingId) => this.setParkingFilter(parkingId));
    this.filtersForm.controls.dateFrom.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((date) => this.setDateFrom(date));
    this.filtersForm.controls.dateTo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((date) => this.setDateTo(date));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      summaries: this.parkingSummaryService.getAll(),
      parkings: this.parkingService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ summaries, parkings }) => {
        this.summaries.set(summaries);
        this.parkings.set(parkings);
        this.pageIndex.set(0);
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  setParkingFilter(parkingId: string | null): void {
    this.selectedParkingId.set(parkingId);
    this.pageIndex.set(0);
  }

  setDateFrom(date: Date | null): void {
    this.dateFrom.set(date);
    this.pageIndex.set(0);
  }

  setDateTo(date: Date | null): void {
    this.dateTo.set(date);
    this.pageIndex.set(0);
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.pageIndex.set(0);
  }
}
