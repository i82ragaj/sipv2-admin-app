import { Component, inject } from '@angular/core';
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

  readonly navLinks: NavLink[] = [
    { path: '/users', label: 'Usuarios', icon: 'people' },
    { path: '/roles', label: 'Roles', icon: 'admin_panel_settings' },
    { path: '/user-roles', label: 'Roles de usuario', icon: 'assignment_ind' },
    { path: '/parkings', label: 'Parkings', icon: 'local_parking' },
    { path: '/parking-statuses', label: 'Estado de parkings', icon: 'monitor_heart' },
    { path: '/counter-configs', label: 'Configuración de contadores', icon: 'tune' },
  ];

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '420px' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
