import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { THEME_HTML_CLASS } from './app/core/config/app-theme.config';

// Aplica la clase del tema activo (ver core/config/app-theme.config.ts) antes
// de arrancar, para que la hoja de colores correcta esté lista desde el
// primer render (sin parpadeo de tema).
document.documentElement.classList.add(THEME_HTML_CLASS);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
