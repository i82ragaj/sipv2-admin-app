import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ParkingService } from '../../core/services/parking.service';
import { NotificationService } from '../../core/services/notification.service';
import { Parking } from '../../core/models/parking.model';
import { ParkingFormDialogComponent } from './parking-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-parkings-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './parkings-list.component.html',
  styleUrl: './parkings-list.component.scss',
})
export class ParkingsListComponent implements OnInit {
  private readonly parkingService = inject(ParkingService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly parkings = signal<Parking[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = ['id', 'name', 'type', 'company', 'srv', 'active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.parkingService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((parkings) => this.parkings.set(parkings));
  }

  openCreate(): void {
    this.dialog
      .open(ParkingFormDialogComponent, { data: null, width: '640px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(parking: Parking): void {
    this.dialog
      .open(ParkingFormDialogComponent, { data: parking, width: '640px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  delete(parking: Parking): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar parking',
          message: `¿Seguro que quieres eliminar el parking "${parking.id}" (${parking.name})?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.parkingService.delete(parking.id).subscribe(() => {
          this.notificationService.success('Parking eliminado.');
          this.load();
        });
      });
  }
}
