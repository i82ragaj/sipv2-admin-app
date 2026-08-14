import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { CounterConfigService } from '../../core/services/counter-config.service';
import { NotificationService } from '../../core/services/notification.service';
import { CounterConfig } from '../../core/models/counter-config.model';

interface CounterConfigForm {
  idpk: FormControl<string>;
  counterId: FormControl<string>;
  counterName: FormControl<string>;
  occupancyLimit: FormControl<number | null>;
  counterType: FormControl<string>;
  isActive: FormControl<boolean>;
}

@Component({
  selector: 'app-counter-config-form-dialog',
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
    <h2 mat-dialog-title>{{ isEdit ? 'Editar configuración de contador' : 'Nueva configuración de contador' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Id de parking (Idpk)</mat-label>
          <input matInput formControlName="idpk" maxlength="10" [readonly]="isEdit" />
          @if (form.controls.idpk.hasError('required')) {
            <mat-error>El id de parking es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Id de contador</mat-label>
          <input matInput formControlName="counterId" maxlength="40" [readonly]="isEdit" />
          @if (form.controls.counterId.hasError('required')) {
            <mat-error>El id de contador es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Nombre del contador</mat-label>
          <input matInput formControlName="counterName" maxlength="50" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Límite de ocupación</mat-label>
          <input matInput type="number" formControlName="occupancyLimit" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Tipo de contador</mat-label>
          <input matInput formControlName="counterType" maxlength="10" />
        </mat-form-field>

        @if (isEdit) {
          <mat-slide-toggle formControlName="isActive">Activo</mat-slide-toggle>
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
export class CounterConfigFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CounterConfigFormDialogComponent>);
  private readonly counterConfigService = inject(CounterConfigService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<CounterConfig | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);

  readonly form = new FormGroup<CounterConfigForm>({
    idpk: new FormControl(this.data?.idpk ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(10)] }),
    counterId: new FormControl(this.data?.counterId ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(40)] }),
    counterName: new FormControl(this.data?.counterName ?? '', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    occupancyLimit: new FormControl(this.data?.occupancyLimit ?? null),
    counterType: new FormControl(this.data?.counterType ?? '', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    isActive: new FormControl(this.data?.isActive ?? true, { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const request$: Observable<unknown> = this.isEdit
      ? this.counterConfigService.update(this.data!.id, {
          isActive: value.isActive,
          counterName: value.counterName || null,
          occupancyLimit: value.occupancyLimit,
          counterType: value.counterType || null,
        })
      : this.counterConfigService.create({
          idpk: value.idpk,
          counterId: value.counterId,
          counterName: value.counterName || null,
          occupancyLimit: value.occupancyLimit,
          counterType: value.counterType || null,
        });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success(this.isEdit ? 'Configuración actualizada.' : 'Configuración creada.');
        this.dialogRef.close(true);
      },
    });
  }
}
