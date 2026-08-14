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
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
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
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns = ['name', 'login', 'email', 'phone', 'active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((users) => this.users.set(users));
  }

  openCreate(): void {
    this.dialog
      .open(UserFormDialogComponent, { data: null, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(user: User): void {
    this.dialog
      .open(UserFormDialogComponent, { data: user, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openResetPassword(user: User): void {
    this.dialog.open(ResetPasswordDialogComponent, { data: user, width: '420px' });
  }

  delete(user: User): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar usuario',
          message: `¿Seguro que quieres eliminar a "${user.name}" (${user.login})?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.userService.delete(user.id).subscribe(() => {
          this.notificationService.success('Usuario eliminado.');
          this.load();
        });
      });
  }
}
