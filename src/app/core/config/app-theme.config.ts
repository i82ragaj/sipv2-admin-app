// Configuración fija del tema visual de la app (colores + logotipo).
//
// La app soporta dos "temas de marca" completos (paleta Material + logo
// propio cada uno). Cuál está activo NO se elige desde la interfaz: se fija
// aquí, en este archivo, y requiere recompilar/desplegar para cambiarlo.
//
// Para volver al tema ESParking, cambia ACTIVE_THEME a 'esparking'. Los
// colores del tema EYSA (ver src/m3-theme-eysa.scss) se generaron a partir
// de un color muestreado del propio logo (logo-eysa-color.png); si la marca
// EYSA tiene un color corporativo oficial distinto, regenera la paleta con
// `ng generate @angular/material:m3-theme --primary-color="#RRGGBB"`.

export type AppTheme = 'esparking' | 'eysa';

// ← Único punto que hay que tocar para cambiar de tema.
export const ACTIVE_THEME: AppTheme = 'esparking';

export const THEME_LOGO_PATHS: Record<AppTheme, string> = {
  esparking: 'assets/logos/esparking_logo.svg',
  eysa: 'assets/logos/logo-eysa-color.png',
};

export const THEME_LOGO_PATH = THEME_LOGO_PATHS[ACTIVE_THEME];

// Clase aplicada a <html> (ver main.ts) para activar la hoja de colores
// correspondiente (ver styles.scss, bloques `html.theme-*`).
export const THEME_HTML_CLASS = `theme-${ACTIVE_THEME}`;
