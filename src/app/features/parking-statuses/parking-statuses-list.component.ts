import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ParkingStatusService } from '../../core/services/parking-status.service';
import { ParkingStatus } from '../../core/models/parking-status.model';

@Component({
  selector: 'app-parking-statuses-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './parking-statuses-list.component.html',
  styleUrl: './parking-statuses-list.component.scss',
})
export class ParkingStatusesListComponent implements OnInit {
  private readonly parkingStatusService = inject(ParkingStatusService);

  readonly statuses = signal<ParkingStatus[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = [
    'id',
    'active',
    'lastImported',
    'lastImportedStatus',
    'lastImportedOk',
    'lastCountTotals',
    'lastImportedDuration',
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.parkingStatusService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((statuses) => this.statuses.set(statuses));
  }
}
