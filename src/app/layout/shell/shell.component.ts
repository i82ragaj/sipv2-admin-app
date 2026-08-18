import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordDialogComponent } from '../../shared/change-password-dialog/change-password-dialog.component';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string;
  // Rol (nombre de MDRol) necesario para ver el grupo; un usuario con el rol
  // "admin" ve siempre todos los grupos, tenga o no este rol concreto.
  requiredRole: string;
  links: NavLink[];
}

const ADMIN_ROLE = 'admin';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly currentUser = this.authService.currentUser;

  readonly navGroups: NavGroup[] = [
    {
      label: 'Seguridad',
      requiredRole: 'security',
      links: [
        { path: '/users', label: 'Usuarios', icon: 'people' },
        { path: '/roles', label: 'Roles', icon: 'admin_panel_settings' },
      ],
    },
    {
      label: 'Configuración',
      requiredRole: 'config',
      links: [
        { path: '/parkings', label: 'Parkings', icon: 'local_parking' },
        { path: '/counter-configs', label: 'Configuración de contadores', icon: 'tune' },
      ],
    },
    {
      // Solo la etiqueta cambia a "Consulta"; el rol que la controla sigue
      // siendo "status" (no se renombra el rol, solo el texto del menú).
      label: 'Consulta',
      requiredRole: 'status',
      links: [
        { path: '/parking-statuses', label: 'Estado de parkings', icon: 'monitor_heart' },
        { path: '/parking-summaries', label: 'Informe ERP', icon: 'summarize' },
      ],
    },
  ];

  // Grupos visibles según los roles del usuario logueado: cada grupo exige su
  // propio rol, salvo el rol "admin", que da acceso a todos los grupos.
  readonly visibleNavGroups = computed(() => {
    const roles = (this.currentUser()?.roles ?? []).map((role) => role.toLowerCase());
    if (roles.includes(ADMIN_ROLE)) {
      return this.navGroups;
    }
    return this.navGroups.filter((group) => roles.includes(group.requiredRole.toLowerCase()));
  });

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '420px' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
