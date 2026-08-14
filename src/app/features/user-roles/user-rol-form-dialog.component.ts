import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize, forkJoin } from 'rxjs';
import { UserRolService } from '../../core/services/user-rol.service';
import { UserService } from '../../core/services/user.service';
import { RolService } from '../../core/services/rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRol } from '../../core/models/user-rol.model';
import { User } from '../../core/models/user.model';
import { Rol } from '../../core/models/rol.model';

interface UserRolForm {
  userId: FormControl<string>;
  rolId: FormControl<string>;
  active: FormControl<boolean>;
}

@Component({
  selector: 'app-user-rol-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar asignación' : 'Nueva asignación' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        @if (loadingOptions()) {
          <div class="spinner-container">
            <mat-spinner diameter="32" />
          </div>
        } @else {
          @if (isEdit) {
            <p>
              <strong>Usuario:</strong> {{ data?.userLogin || '—' }}<br />
              <strong>Rol:</strong> {{ data?.rolName || '—' }}
            </p>
            <mat-slide-toggle formControlName="active">Activo</mat-slide-toggle>
          } @else {
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Usuario</mat-label>
              <mat-select formControlName="userId">
                @for (user of users(); track user.id) {
                  <mat-option [value]="user.id">{{ user.login }} — {{ user.name }}</mat-option>
                }
              </mat-select>
              @if (form.controls.userId.hasError('required')) {
                <mat-error>Selecciona un usuario.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Rol</mat-label>
              <mat-select formControlName="rolId">
                @for (rol of roles(); track rol.id) {
                  <mat-option [value]="rol.id">{{ rol.name }}</mat-option>
                }
              </mat-select>
              @if (form.controls.rolId.hasError('required')) {
                <mat-error>Selecciona un rol.</mat-error>
              }
            </mat-form-field>
          }
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Guardar
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
      max-width: 420px;
    }
  `,
})
export class UserRolFormDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserRolFormDialogComponent>);
  private readonly userRolService = inject(UserRolService);
  private readonly userService = inject(UserService);
  private readonly rolService = inject(RolService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<UserRol | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);
  readonly loadingOptions = signal(!this.isEdit);
  readonly users = signal<User[]>([]);
  readonly roles = signal<Rol[]>([]);

  readonly form = new FormGroup<UserRolForm>({
    userId: new FormControl(this.data?.userId ?? '', { nonNullable: true, validators: this.isEdit ? [] : [Validators.required] }),
    rolId: new FormControl(this.data?.rolId ?? '', { nonNullable: true, validators: this.isEdit ? [] : [Validators.required] }),
    active: new FormControl(this.data?.active ?? true, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.isEdit) {
      return;
    }
    forkJoin([this.userService.getAll(), this.rolService.getAll()])
      .pipe(finalize(() => this.loadingOptions.set(false)))
      .subscribe(([users, roles]) => {
        this.users.set(users);
        this.roles.set(roles);
      });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const request$: Observable<unknown> = this.isEdit
      ? this.userRolService.updateActive(this.data!.id, { active: value.active })
      : this.userRolService.create({ userId: value.userId, rolId: value.rolId });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success(this.isEdit ? 'Asignación actualizada.' : 'Asignación creada.');
        this.dialogRef.close(true);
      },
    });
  }
}
