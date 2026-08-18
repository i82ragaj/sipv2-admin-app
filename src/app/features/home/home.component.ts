import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

// Pantalla inicial tras el login. No pide nada a la API: así, un usuario sin
// ninguno de los roles de grupo (security/config/status) siempre tiene un
// sitio al que aterrizar en vez de un 403 en la primera pantalla que carga.
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
}
