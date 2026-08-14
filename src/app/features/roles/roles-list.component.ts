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
import { RolService } from '../../core/services/rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { Rol } from '../../core/models/rol.model';
import { RolFormDialogComponent } from './rol-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles-list',
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
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
})
export class RolesListComponent implements OnInit {
  private readonly rolService = inject(RolService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly roles = signal<Rol[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = ['name', 'description', 'active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.rolService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((roles) => this.roles.set(roles));
  }

  openCreate(): void {
    this.dialog
      .open(RolFormDialogComponent, { data: null, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(rol: Rol): void {
    this.dialog
      .open(RolFormDialogComponent, { data: rol, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  delete(rol: Rol): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar rol',
          message: `¿Seguro que quieres eliminar el rol "${rol.name}"?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.rolService.delete(rol.id).subscribe(() => {
          this.notificationService.success('Rol eliminado.');
          this.load();
        });
      });
  }
}
