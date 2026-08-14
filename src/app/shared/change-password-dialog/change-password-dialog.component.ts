import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { NotificationService } from '../../core/services/notification.service';
import { passwordMatchValidator } from '../validators/password-match.validator';

interface ChangePasswordForm {
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

// Autoservicio: el usuario autenticado (cualquier rol) cambia su propia contraseña.
// Accesible desde el menú de usuario del shell (PUT /api/account/password).
@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar mi contraseña</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Contraseña actual</mat-label>
          <input matInput type="password" formControlName="currentPassword" autocomplete="current-password" />
          @if (form.controls.currentPassword.hasError('required')) {
            <mat-error>La contraseña actual es obligatoria.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Nueva contraseña</mat-label>
          <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
          @if (form.controls.newPassword.hasError('required')) {
            <mat-error>La nueva contraseña es obligatoria.</mat-error>
          }
          @if (form.controls.newPassword.hasError('minlength')) {
            <mat-error>Debe tener al menos 6 caracteres.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Confirmar nueva contraseña</mat-label>
          <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
          @if (form.controls.confirmPassword.hasError('passwordMismatch')) {
            <mat-error>Las contraseñas no coinciden.</mat-error>
          }
        </mat-form-field>

        @if (errorMessage()) {
          <p class="form-error">{{ errorMessage() }}</p>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Cambiar contraseña
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

    .form-error {
      color: #c62828;
      font-size: 13px;
      margin: 0 0 8px;
    }
  `,
})
export class ChangePasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private readonly accountService = inject(AccountService);
  private readonly notificationService = inject(NotificationService);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup<ChangePasswordForm>(
    {
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
  );

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.accountService
      .changeOwnPassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Contraseña actualizada.');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          // El interceptor global ya muestra el snackbar; aquí además lo dejamos fijo en el diálogo.
          this.errorMessage.set(
            (error.error as { message?: string } | null)?.message ?? 'No se pudo cambiar la contraseña.',
          );
        },
      });
  }
}
