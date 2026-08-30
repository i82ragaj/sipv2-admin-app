import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ParkingStatusService } from '../../core/services/parking-status.service';
import { ParkingTypeService } from '../../core/services/parking-type.service';
import { NotificationService } from '../../core/services/notification.service';
import { ParkingStatus } from '../../core/models/parking-status.model';
import { ParkingType, parkingTypeLabel } from '../../core/models/parking-type.model';

const IMPORTABLE_STATUSES = ['OK', 'ERROR'];

@Component({
  selector: 'app-parking-statuses-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './parking-statuses-list.component.html',
  styleUrl: './parking-statuses-list.component.scss',
})
export class ParkingStatusesListComponent implements OnInit {
  private readonly parkingStatusService = inject(ParkingStatusService);
  private readonly parkingTypeService = inject(ParkingTypeService);
  private readonly notificationService = inject(NotificationService);

  readonly statuses = signal<ParkingStatus[]>([]);
  readonly parkingTypes = signal<ParkingType[]>([]);
  readonly loading = signal(false);
  readonly onlyActive = signal(true);
  // Fila cuya importación diaria se está solicitando, para deshabilitar solo ese botón.
  readonly requestingId = signal<string | null>(null);

  // El parking vinculado puede estar desactivado (borrado lógico) aunque su
  // fila de estado siga existiendo; "Solo activos" filtra por eso.
  readonly filteredStatuses = computed(() =>
    this.onlyActive() ? this.statuses().filter((status) => status.parkingActive) : this.statuses(),
  );

  typeLabel(typeId: string): string {
    return parkingTypeLabel(typeId, this.parkingTypes());
  }

  readonly displayedColumns = [
    'id',
    'parkingName',
    'parkingType',
    'parkingServerIp',
    'parkingJob',
    'parkingLoadDate',
    'lastCountTotals',
    'lastImported',
    'lastImportedDuration',
    'lastImportedStatus',
    'lastImportedOk',
    'actions',
  ];

  ngOnInit(): void {
    this.parkingTypeService.getAll().subscribe((types) => this.parkingTypes.set(types));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.parkingStatusService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((statuses) => this.statuses.set(statuses));
  }

  // El botón "Importación Diaria" se habilita si el parking aún no ha
  // importado nunca (estado null) o si la última importación ya terminó (OK
  // o ERROR); se deshabilita si ya está PENDIENTE, para no pedirla dos veces.
  canRequestDailyImport(status: ParkingStatus): boolean {
    return (
      this.requestingId() !== status.id &&
      (status.lastImportedStatus === null || IMPORTABLE_STATUSES.includes(status.lastImportedStatus))
    );
  }

  requestDailyImport(status: ParkingStatus): void {
    this.requestingId.set(status.id);
    this.parkingStatusService
      .requestDailyImport(status.id)
      .pipe(finalize(() => this.requestingId.set(null)))
      .subscribe(() => {
        this.notificationService.success(`Importación diaria de "${status.id}" solicitada.`);
        this.load();
      });
  }
}
