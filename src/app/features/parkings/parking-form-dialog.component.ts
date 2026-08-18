import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { ParkingService } from '../../core/services/parking.service';
import { NotificationService } from '../../core/services/notification.service';
import { PARKING_FREQUENCIES, PARKING_TYPES, Parking } from '../../core/models/parking.model';

interface ParkingForm {
  id: FormControl<string>;
  type: FormControl<string>;
  srv: FormControl<string>;
  name: FormControl<string>;
  company: FormControl<string>;
  dacode: FormControl<string>;
  dateFromTable: FormControl<Date | null>;
  dateToTable: FormControl<Date | null>;
  ndays: FormControl<number | null>;
  truncateTables: FormControl<boolean>;
  sii: FormControl<boolean>;
  multiCounter: FormControl<boolean>;
  serverIp: FormControl<string>;
  job: FormControl<string>;
  loadDate: FormControl<string>;
  frecuency: FormControl<string>;
  active: FormControl<boolean>;
}

function toDateOnlyString(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Component({
  selector: 'app-parking-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar parking' : 'Nuevo parking' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <div class="grid-2">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Id</mat-label>
            <input matInput formControlName="id" maxlength="10" [readonly]="isEdit" />
            @if (form.controls.id.hasError('required')) {
              <mat-error>El id es obligatorio.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type">
              @for (parkingType of parkingTypes; track parkingType.value) {
                <mat-option [value]="parkingType.value">{{ parkingType.label }}</mat-option>
              }
            </mat-select>
            @if (form.controls.type.hasError('required')) {
              <mat-error>El tipo es obligatorio.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" maxlength="100" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Empresa</mat-label>
            <input matInput formControlName="company" maxlength="100" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Servidor (Srv)</mat-label>
            <input matInput formControlName="srv" maxlength="10" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Departamento</mat-label>
            <input matInput formControlName="dacode" maxlength="10" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>IP del servidor</mat-label>
            <input matInput formControlName="serverIp" maxlength="20" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Job</mat-label>
            <input matInput formControlName="job" maxlength="100" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Fecha desde (tabla)</mat-label>
            <input matInput [matDatepicker]="fromPicker" formControlName="dateFromTable" />
            <mat-datepicker-toggle matSuffix [for]="fromPicker" />
            <mat-datepicker #fromPicker />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Fecha hasta (tabla)</mat-label>
            <input matInput [matDatepicker]="toPicker" formControlName="dateToTable" />
            <mat-datepicker-toggle matSuffix [for]="toPicker" />
            <mat-datepicker #toPicker />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nº de días</mat-label>
            <input matInput type="number" formControlName="ndays" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Hora de carga</mat-label>
            <input matInput type="time" step="1" formControlName="loadDate" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Frecuencia</mat-label>
            <mat-select formControlName="frecuency">
              <mat-option value="">Sin especificar</mat-option>
              @for (frecuency of parkingFrequencies; track frecuency.value) {
                <mat-option [value]="frecuency.value">{{ frecuency.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="toggles-row">
          <mat-slide-toggle formControlName="truncateTables">Truncar tablas</mat-slide-toggle>
          <mat-slide-toggle formControlName="sii">SII</mat-slide-toggle>
          <mat-slide-toggle formControlName="multiCounter">Multi-contador</mat-slide-toggle>
          @if (isEdit) {
            <mat-slide-toggle formControlName="active">Activo</mat-slide-toggle>
          }
        </div>
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
      max-width: 620px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }

    .toggles-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 8px 0 16px;
    }
  `,
})
export class ParkingFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ParkingFormDialogComponent>);
  private readonly parkingService = inject(ParkingService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<Parking | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);
  readonly parkingTypes = PARKING_TYPES;
  readonly parkingFrequencies = PARKING_FREQUENCIES;

  readonly form = new FormGroup<ParkingForm>({
    id: new FormControl(this.data?.id ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(10)] }),
    type: new FormControl(this.data?.type ?? '', { nonNullable: true, validators: [Validators.required] }),
    srv: new FormControl(this.data?.srv ?? '', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    name: new FormControl(this.data?.name ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    company: new FormControl(this.data?.company ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    dacode: new FormControl(this.data?.dacode ?? '', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    dateFromTable: new FormControl(parseDateOnly(this.data?.dateFromTable ?? null)),
    dateToTable: new FormControl(parseDateOnly(this.data?.dateToTable ?? null)),
    ndays: new FormControl(this.data?.ndays ?? null),
    truncateTables: new FormControl(this.data?.truncateTables ?? false, { nonNullable: true }),
    sii: new FormControl(this.data?.sii ?? false, { nonNullable: true }),
    multiCounter: new FormControl(this.data?.multiCounter ?? false, { nonNullable: true }),
    serverIp: new FormControl(this.data?.serverIp ?? '', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    job: new FormControl(this.data?.job ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    loadDate: new FormControl(this.data?.loadDate?.substring(0, 8) ?? '', { nonNullable: true }),
    frecuency: new FormControl(this.data?.frecuency ?? '', { nonNullable: true }),
    active: new FormControl(this.data?.active ?? true, { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const common = {
      type: value.type,
      srv: value.srv || null,
      name: value.name || null,
      company: value.company || null,
      dacode: value.dacode || null,
      dateFromTable: toDateOnlyString(value.dateFromTable),
      dateToTable: toDateOnlyString(value.dateToTable),
      ndays: value.ndays,
      truncateTables: value.truncateTables,
      sii: value.sii,
      multiCounter: value.multiCounter,
      serverIp: value.serverIp || null,
      job: value.job || null,
      loadDate: value.loadDate || null,
      frecuency: value.frecuency || null,
    };

    const request$: Observable<unknown> = this.isEdit
      ? this.parkingService.update(this.data!.id, { ...common, active: value.active })
      : this.parkingService.create({ ...common, id: value.id });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notificationService.success(this.isEdit ? 'Parking actualizado.' : 'Parking creado.');
        this.dialogRef.close(true);
      },
    });
  }
}
