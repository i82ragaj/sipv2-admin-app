import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

// Centraliza el manejo de errores HTTP: sesión expirada (401) y mensajes de negocio del backend.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.endsWith('/login')) {
        authService.logout();
        router.navigate(['/login']);
        notificationService.error('Tu sesión ha expirado. Vuelve a iniciar sesión.');
        return throwError(() => error);
      }

      const backendMessage = (error.error as { message?: string } | null)?.message;
      if (backendMessage) {
        notificationService.error(backendMessage);
      } else if (error.status === 0) {
        notificationService.error('No se pudo contactar con el servidor.');
      } else if (!req.url.endsWith('/login')) {
        notificationService.error('Ha ocurrido un error inesperado.');
      }

      return throwError(() => error);
    }),
  );
};
