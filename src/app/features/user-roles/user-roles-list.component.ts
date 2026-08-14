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
import { UserRolService } from '../../core/services/user-rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRol } from '../../core/models/user-rol.model';
import { UserRolFormDialogComponent } from './user-rol-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-roles-list',
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
  templateUrl: './user-roles-list.component.html',
  styleUrl: './user-roles-list.component.scss',
})
export class UserRolesListComponent implements OnInit {
  private readonly userRolService = inject(UserRolService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly userRoles = signal<UserRol[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = ['userLogin', 'rolName', 'active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userRolService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((userRoles) => this.userRoles.set(userRoles));
  }

  openCreate(): void {
    this.dialog
      .open(UserRolFormDialogComponent, { data: null, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(userRol: UserRol): void {
    this.dialog
      .open(UserRolFormDialogComponent, { data: userRol, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  delete(userRol: UserRol): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar asignación',
          message: `¿Seguro que quieres quitar el rol "${userRol.rolName}" al usuario "${userRol.userLogin}"?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.userRolService.delete(userRol.id).subscribe(() => {
          this.notificationService.success('Asignación eliminada.');
          this.load();
        });
      });
  }
}
