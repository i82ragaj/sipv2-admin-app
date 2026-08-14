import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { passwordMatchValidator } from '../../shared/validators/password-match.validator';

interface ResetPasswordForm {
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

// Un Admin fija la contraseña de cualquier usuario, sin necesidad de conocer la actual
// (PUT /api/users/{id}/password). Se abre desde el listado de usuarios.
@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Restablecer contraseña</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <p>
          Vas a fijar una nueva contraseña para <strong>{{ data.login }}</strong> ({{ data.name }}).
        </p>

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
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Restablecer
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
export class ResetPasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<User>(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  readonly form = new FormGroup<ResetPasswordForm>(
    {
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

    this.saving.set(true);
    const { newPassword } = this.form.getRawValue();

    const request$: Observable<unknown> = this.userService.resetPassword(this.data.id, { newPassword });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success('Contraseña restablecida.');
        this.dialogRef.close(true);
      },
    });
  }
}
