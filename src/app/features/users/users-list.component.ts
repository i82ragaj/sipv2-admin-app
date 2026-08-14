import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { finalize, forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { UserRolService } from '../../core/services/user-rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { UserRol } from '../../core/models/user-rol.model';
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
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly userRolService = inject(UserRolService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly onlyActive = signal(true);

  // Nombres de rol (activos) de cada usuario, ordenados alfabéticamente y
  // unidos con coma, listos para pintar en la columna "Roles".
  readonly rolesByUser = signal<Map<string, string>>(new Map());

  readonly filteredUsers = computed(() =>
    this.onlyActive() ? this.users().filter((user) => user.active) : this.users(),
  );

  readonly displayedColumns = ['name', 'login', 'email', 'roles', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin([this.userService.getAll(), this.userRolService.getAll()])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(([users, userRoles]) => {
        this.users.set(users);
        this.rolesByUser.set(this.buildRolesByUser(userRoles));
      });
  }

  rolesFor(userId: string): string {
    return this.rolesByUser().get(userId) ?? '—';
  }

  private buildRolesByUser(userRoles: UserRol[]): Map<string, string> {
    const namesByUser = new Map<string, string[]>();
    for (const userRol of userRoles) {
      if (!userRol.active || !userRol.userId || !userRol.rolName) {
        continue;
      }
      const names = namesByUser.get(userRol.userId) ?? [];
      names.push(userRol.rolName);
      namesByUser.set(userRol.userId, names);
    }

    const result = new Map<string, string>();
    for (const [userId, names] of namesByUser) {
      result.set(userId, [...names].sort((a, b) => a.localeCompare(b)).join(', '));
    }
    return result;
  }

  openCreate(): void {
    this.dialog
      .open(UserFormDialogComponent, { data: null, width: '680px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  openEdit(user: User): void {
    this.dialog
      .open(UserFormDialogComponent, { data: user, width: '680px' })
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
