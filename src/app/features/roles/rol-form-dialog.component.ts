import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { RolService } from '../../core/services/rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { Rol } from '../../core/models/rol.model';

interface RolForm {
  name: FormControl<string>;
  description: FormControl<string>;
  active: FormControl<boolean>;
}

@Component({
  selector: 'app-rol-form-dialog',
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
    <h2 mat-dialog-title>{{ isEdit ? 'Editar rol' : 'Nuevo rol' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
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
export class RolFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RolFormDialogComponent>);
  private readonly rolService = inject(RolService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<Rol | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);

  readonly form = new FormGroup<RolForm>({
    name: new FormControl(this.data?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(this.data?.description ?? '', { nonNullable: true }),
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
      ? this.rolService.update(this.data!.id, {
          name: value.name,
          description: value.description || null,
          active: value.active,
        })
      : this.rolService.create({
          name: value.name,
          description: value.description || null,
        });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success(this.isEdit ? 'Rol actualizado.' : 'Rol creado.');
        this.dialogRef.close(true);
      },
    });
  }
}
