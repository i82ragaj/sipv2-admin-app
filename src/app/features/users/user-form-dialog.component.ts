import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize, forkJoin, of, switchMap } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { RolService } from '../../core/services/rol.service';
import { UserRolService } from '../../core/services/user-rol.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { Rol } from '../../core/models/rol.model';
import { UserRol } from '../../core/models/user-rol.model';

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
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-content">
        <div class="form-column">
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
        </div>

        <div class="roles-column">
          <span class="roles-title">Roles</span>
          @if (loadingRoles()) {
            <div class="spinner-container">
              <mat-spinner diameter="28" />
            </div>
          } @else if (roles().length === 0) {
            <p class="roles-empty">No hay roles disponibles.</p>
          } @else {
            <div class="roles-list">
              @for (rol of roles(); track rol.id) {
                <mat-checkbox
                  [checked]="selectedRoleIds().has(rol.id)"
                  (change)="toggleRole(rol.id, $event.checked)"
                >
                  {{ rol.name }}
                </mat-checkbox>
              }
            </div>
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
      flex-direction: row;
      align-items: flex-start;
      gap: 20px;
      min-width: 320px;
      max-width: 640px;
    }

    .form-column {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1 1 260px;
      min-width: 260px;
    }

    .roles-column {
      flex: 0 0 180px;
      padding-left: 20px;
      border-left: 1px solid rgba(11, 46, 107, 0.12);
      align-self: stretch;
    }

    .roles-title {
      display: block;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--brand-navy, #0b2e6b);
      margin-bottom: 6px;
    }

    .roles-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 340px;
      overflow-y: auto;
    }

    .roles-empty {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0;
    }
  `,
})
export class UserFormDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly rolService = inject(RolService);
  private readonly userRolService = inject(UserRolService);
  private readonly notificationService = inject(NotificationService);
  readonly data = inject<User | null>(MAT_DIALOG_DATA);

  readonly isEdit = this.data !== null;
  readonly saving = signal(false);

  // Gestión de roles (al crear y al editar): roles disponibles, seleccionados
  // y asignaciones (UserRol) que ya existían al abrir el diálogo (solo aplica
  // al editar), para poder diferenciar "crear", "reactivar" y "quitar" al
  // guardar.
  readonly loadingRoles = signal(true);
  readonly roles = signal<Rol[]>([]);
  readonly selectedRoleIds = signal<Set<string>>(new Set());
  private existingAssignments = new Map<string, UserRol>();

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

  ngOnInit(): void {
    if (!this.isEdit) {
      this.rolService
        .getAll()
        .pipe(finalize(() => this.loadingRoles.set(false)))
        .subscribe((roles) => this.roles.set(roles));
      return;
    }

    forkJoin([this.rolService.getAll(), this.userRolService.getAll()])
      .pipe(finalize(() => this.loadingRoles.set(false)))
      .subscribe(([roles, userRoles]) => {
        this.roles.set(roles);

        const selected = new Set<string>();
        for (const userRol of userRoles) {
          if (userRol.userId !== this.data!.id || !userRol.rolId) {
            continue;
          }
          this.existingAssignments.set(userRol.rolId, userRol);
          if (userRol.active) {
            selected.add(userRol.rolId);
          }
        }
        this.selectedRoleIds.set(selected);
      });
  }

  toggleRole(rolId: string, checked: boolean): void {
    const next = new Set(this.selectedRoleIds());
    if (checked) {
      next.add(rolId);
    } else {
      next.delete(rolId);
    }
    this.selectedRoleIds.set(next);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const userRequest$: Observable<User | void> = this.isEdit
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

    userRequest$
      .pipe(
        // Al editar ya conocemos el id (this.data); al crear, lo devuelve la API.
        switchMap((created) => this.syncRoles(this.isEdit ? this.data!.id : (created as User).id)),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.notificationService.success(this.isEdit ? 'Usuario actualizado.' : 'Usuario creado.');
          this.dialogRef.close(true);
        },
      });
  }

  // Compara la selección actual de roles con las asignaciones (UserRol) que
  // existían al abrir el diálogo (ninguna, al crear) y emite solo los
  // cambios: crea las nuevas, reactiva las que estaban inactivas y elimina
  // las que se han desmarcado.
  private syncRoles(userId: string): Observable<unknown> {
    const selected = this.selectedRoleIds();
    const requests: Observable<unknown>[] = [];

    for (const rol of this.roles()) {
      const existing = this.existingAssignments.get(rol.id);
      const shouldHaveRole = selected.has(rol.id);

      if (shouldHaveRole && !existing) {
        requests.push(this.userRolService.create({ userId, rolId: rol.id }));
      } else if (shouldHaveRole && existing && !existing.active) {
        requests.push(this.userRolService.updateActive(existing.id, { active: true }));
      } else if (!shouldHaveRole && existing && existing.active) {
        requests.push(this.userRolService.delete(existing.id));
      }
    }

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }
}
