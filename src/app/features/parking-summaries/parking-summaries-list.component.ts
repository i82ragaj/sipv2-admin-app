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
import { ParkingSummaryDetail } from '../../core/models/parking-summary-detail.model';
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
  // DatePipe/DecimalPipe en `imports` solo los habilita como pipes de
  // plantilla; para poder inyectarlos con inject() (detailFields() los usa
  // fuera de la plantilla) también hay que declararlos como providers.
  providers: [DatePipe, DecimalPipe],
})
export class ParkingSummariesListComponent implements OnInit {
  private readonly parkingSummaryService = inject(ParkingSummaryService);
  private readonly parkingService = inject(ParkingService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly datePipe = inject(DatePipe);

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
    'expand',
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
  readonly detailColumn = ['expandedDetail'];

  // Fila con el detalle desplegado (comparación por referencia, como en el
  // ejemplo oficial de Angular Material); se pierde sola al recargar porque
  // summaries() pasa a apuntar a objetos nuevos.
  readonly expandedRow = signal<ParkingSummary | null>(null);

  // Desglose por tipo de pago (VParkingSummaryDetail) de la fila expandida;
  // solo hay una fila expandida a la vez, así que basta un signal (no un
  // mapa por fila). Se cachea por objeto de fila para no repetir la petición
  // al volver a abrir la misma fila.
  private readonly detailsCache = new Map<ParkingSummary, ParkingSummaryDetail[]>();
  readonly rowDetails = signal<ParkingSummaryDetail[]>([]);
  readonly rowDetailsLoading = signal(false);

  toggleRow(summary: ParkingSummary): void {
    if (this.expandedRow() === summary) {
      this.expandedRow.set(null);
      return;
    }

    this.expandedRow.set(summary);

    const cached = this.detailsCache.get(summary);
    if (cached) {
      this.rowDetails.set(cached);
      return;
    }

    this.rowDetails.set([]);
    this.rowDetailsLoading.set(true);
    this.parkingSummaryService
      .getDetails(summary.idpk, summary.date ?? '', summary.id)
      .pipe(finalize(() => this.rowDetailsLoading.set(false)))
      .subscribe((details) => {
        this.detailsCache.set(summary, details);
        // El usuario pudo haber cambiado de fila mientras la petición estaba
        // en curso; solo pintamos si sigue siendo la fila expandida.
        if (this.expandedRow() === summary) {
          this.rowDetails.set(details);
        }
      });
  }

  // CDK Table solo permite una *matRowDef "por defecto" (sin `when`) por
  // tabla; como ya tenemos la fila de datos como esa fila por defecto, la
  // fila de detalle necesita un `when` explícito (que siempre matchea, una
  // fila de detalle por cada fila de datos) para no chocar con ella.
  readonly matchAllRows = () => true;

  // Ficha de la fila para el panel desplegable "Ver detalle", agrupada y
  // etiquetada según el diseño acordado con el cliente. ACA/CEI/CER son
  // nombres de campo heredados de la vista SQL sin significado obvio por sí
  // mismos; el cliente confirmó su equivalencia de negocio:
  // Acatotal/Acanum = Cancelaciones, Ceitotal/Ceinum = Bonos emitidas,
  // Certotal/Cernum = Bonos devueltas, InvoicesTotal/InvoicesNum = Ventas.
  detailFields(summary: ParkingSummary): { label: string; value: string }[] {
    const num = (value: number | null) =>
      value !== null ? (this.decimalPipe.transform(value, '1.2-2') ?? '—') : '—';
    const int = (value: number | null) => (value !== null ? String(value) : '—');
    const text = (value: string | null) => value || '—';
    const date = (value: string | null) =>
      value ? (this.datePipe.transform(value, 'dd/MM/yyyy') ?? '—') : '—';

    return [
      { label: 'Parking', value: summary.idpk },
      { label: 'Fecha', value: date(summary.date) },
      { label: 'Fact. Desde', value: text(summary.invoiceNoMin) },
      { label: 'Fact. Hasta', value: text(summary.invoiceNoMax) },
      { label: 'Operaciones', value: int(summary.operations) },
      { label: 'Total', value: num(summary.total) },
      { label: 'Transacciones', value: num(summary.parkingTransTotal) },
      { label: 'Nº Transacciones', value: int(summary.parkingTransNum) },
      { label: 'Ventas', value: num(summary.invoicesTotal) },
      { label: 'Nº Ventas', value: int(summary.invoicesNum) },
      { label: 'Cancelaciones', value: num(summary.acatotal) },
      { label: 'Nº Cancelaciones', value: int(summary.acanum) },
      { label: 'Bon. Emitidas', value: num(summary.ceitotal) },
      { label: 'Nº Bon. Emitidas', value: int(summary.ceinum) },
      { label: 'Bon. Devueltas', value: num(summary.certotal) },
      { label: 'Nº Bon. Devueltas', value: int(summary.cernum) },
      { label: 'Efectivo', value: num(summary.cashTotal) },
      { label: 'Nº Efectivo', value: int(summary.cashNum) },
      { label: 'Resto', value: num(summary.restTotal) },
      { label: 'Nº Resto', value: int(summary.restNum) },
    ];
  }

  ngOnInit(): void {
    this.parkingService.getAll().subscribe((parkings) => this.parkings.set(parkings));
    this.load();
  }

  load(): void {
    const { parkingId, dateFrom, dateTo } = this.filtersForm.value;

    this.expandedRow.set(null);
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
