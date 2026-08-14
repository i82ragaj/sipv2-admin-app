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
import { CounterConfigService } from '../../core/services/counter-config.service';
import { NotificationService } from '../../core/services/notification.service';
import { CounterConfig } from '../../core/models/counter-config.model';
import { CounterConfigFormDialogComponent } from './counter-config-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-counter-configs-list',
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
  templateUrl: './counter-configs-list.component.html',
  styleUrl: './counter-configs-list.component.scss',
})
export class CounterConfigsListComponent implements OnInit {
  private readonly counterConfigService = inject(CounterConfigService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly counterConfigs = signal<CounterConfig[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = ['idpk', 'counterId', 'counterName', 'occupancyLimit', 'counterType', 'isActive', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.counterConfigService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((counterConfigs) => this.counterConfigs.set(counterConfigs));
  }

  openCreate(): void {
    this.dialog
      .open(CounterConfigFormDialogComponent, { data: null, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(counterConfig: CounterConfig): void {
    this.dialog
      .open(CounterConfigFormDialogComponent, { data: counterConfig, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  delete(counterConfig: CounterConfig): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar configuración',
          message: `¿Seguro que quieres eliminar la configuración del contador "${counterConfig.counterId}"?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.counterConfigService.delete(counterConfig.id).subscribe(() => {
          this.notificationService.success('Configuración eliminada.');
          this.load();
        });
      });
  }
}
