import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';

interface UserForm {
  name: FormControl<string>;
  lastName: FormControl<string>;
  lastName1: FormControl<string>;
  login: FormControl<string>;
  password: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  active: FormControl<boolean>;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="50" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Primer apellido</mat-label>
          <input matInput formControlName="lastName" maxlength="50" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Segundo apellido</mat-label>
          <input matInput formControlName="lastName1" maxlength="50" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Login</mat-label>
          <input matInput formControlName="login" maxlength="100" [readonly]="isEdit" />
          @if (form.controls.login.hasError('required')) {
            <mat-error>El login es obligatorio.</mat-error>
          }
        </mat-form-field>

        @if (!isEdit) {
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.hasError('required')) {
              <mat-error>La contraseña es obligatoria.</mat-error>
            }
            @if (form.controls.password.hasError('minlength')) {
              <mat-error>Debe tener al menos 6 caracteres.</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" maxlength="50" />
        </mat-form-field>

        @if (isEdit) {
          <mat-slide-toggle formControlName="active">Activo</mat-slide-toggle>
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
      gap: 4px;
      min-width: 320px;
      max-width: 420px;
    }
  `,
})
export class UserFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<User | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);

  readonly form = new FormGroup<UserForm>({
    name: new FormControl(this.data?.name ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    lastName: new FormControl(this.data?.lastName ?? '', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    lastName1: new FormControl(this.data?.lastName1 ?? '', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    login: new FormControl(this.data?.login ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    password: new FormControl('', { nonNullable: true, validators: this.isEdit ? [] : [Validators.required, Validators.minLength(6)] }),
    email: new FormControl(this.data?.email ?? '', { nonNullable: true }),
    phone: new FormControl(this.data?.phone ?? '', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    active: new FormControl(this.data?.active ?? true, { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const request$: Observable<unknown> = this.isEdit
      ? this.userService.update(this.data!.id, {
          name: value.name,
          lastName: value.lastName || null,
          lastName1: value.lastName1 || null,
          email: value.email || null,
          phone: value.phone || null,
          active: value.active,
        })
      : this.userService.create({
          name: value.name,
          lastName: value.lastName || null,
          lastName1: value.lastName1 || null,
          login: value.login,
          password: value.password,
          email: value.email || null,
          phone: value.phone || null,
        });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success(this.isEdit ? 'Usuario actualizado.' : 'Usuario creado.');
        this.dialogRef.close(true);
      },
    });
  }
}
