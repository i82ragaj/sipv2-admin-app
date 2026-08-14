import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador de grupo: compara dos controles hermanos (p. ej. nueva contraseña / confirmación)
// y marca 'passwordMismatch' en el control de confirmación cuando difieren.
export function passwordMatchValidator(passwordControlName: string, confirmControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName);
    const confirm = group.get(confirmControlName);
    if (!password || !confirm) {
      return null;
    }

    if (confirm.value && confirm.value !== password.value) {
      confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
    } else if (confirm.hasError('passwordMismatch')) {
      const { passwordMismatch, ...rest } = confirm.errors ?? {};
      confirm.setErrors(Object.keys(rest).length ? rest : null);
    }

    return null;
  };
}
