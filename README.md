# sipv2-admin-app

Frontend Angular (standalone components + Angular Material) para **SIPV2.AdminAppApi**.
Replica exactamente las rutas y los campos expuestos por el backend: `Users`, `Roles`,
`UserRoles`, `Parkings`, `ParkingStatuses` (solo lectura) y `CounterConfigs`, más el login
JWT contra `POST /login`.

> Este proyecto se generó a mano (sin `ng new`/`npm install`) porque la máquina donde se
> creó no tiene Node.js instalado. Antes de usarlo necesitas instalar dependencias.

## Requisitos

- Node.js 18.19+ o 20.x (compatible con Angular 18) y npm.
- El backend `SIPV2.AdminAppApi` corriendo en `https://localhost:7119` (perfil `https` de
  `launchSettings.json`), con `ConnectionStrings:DefaultConnection` y `Jwt:Key` configurados.

## Puesta en marcha

```bash
npm install
npm start        # ng serve, http://localhost:4200
```

`ng serve` usa `proxy.conf.js` para reenviar `/api/*` y `/login` a
`https://localhost:7119`. Esto evita tener que tocar el backend: **`Program.cs` no define
ninguna política CORS**, así que sin el proxy (o sin configurar CORS en el backend) el
navegador bloquearía las llamadas al abrir la app directamente contra otro origen/puerto.
La regla de `/login` usa una función `bypass` (por eso es `.js` y no `.json`) para proxear
al backend solo el `POST` real de login; una navegación `GET` a la página `/login` (recargar,
pegar la URL) la sirve el propio dev server, no el backend.

Para producción, edita `src/environments/environment.production.ts` con la URL real de la
API antes de compilar (`npm run build`).

## Tema visual (marca + logotipo)

La app admite varios "temas de marca" completos (paleta de colores Material + logotipo
propio), pero **no hay selector en la interfaz**: el tema activo se fija en un único sitio
del código y requiere recompilar/redesplegar para cambiarlo.

```ts
// src/app/core/config/app-theme.config.ts
export const ACTIVE_THEME: AppTheme = 'eysa'; // ← cambiar aquí ('esparking' | 'eysa')
```

Ese es el único cambio necesario para pasar de un tema a otro: `main.ts` lee esa constante
y añade la clase `theme-<nombre>` a `<html>` antes de arrancar Angular (sin parpadeo de
tema), y todo lo demás (paleta Material, colores de marca, logo del login y del menú
lateral) se resuelve solo a partir de ella.

Qué hay detrás de cada tema:

| | ESParking (`esparking`) | EYSA (`eysa`) |
|---|---|---|
| Logo | `src/assets/logos/esparking_logo.svg` | `src/assets/logos/logo-eysa-color.png` |
| Paleta Material | `src/m3-theme.scss` (`$light-theme`) | `src/m3-theme-eysa.scss` (`$eysa-theme`) |
| Colores de marca (CSS vars) | `styles.scss` → bloque `html.theme-esparking` | `styles.scss` → bloque `html.theme-eysa` |

Ambas hojas de estilo Material se generaron con el schematic oficial de Angular Material:

```bash
ng generate @angular/material:m3-theme --primary-color="#RRGGBB" --tertiary-color="#RRGGBB"
```

(el resultado se copió a mano a `m3-theme.scss`/`m3-theme-eysa.scss` y se le cambió el
nombre de la variable exportada; ver el comentario de cabecera de cada archivo). Los colores
de marca del tema EYSA se muestrearon por píxel del propio logo (`#004358` del texto,
`#56C3F1` de uno de los puntos del icono) al no tener un color corporativo oficial en el
momento de crear el tema — si EYSA tiene uno distinto, regenera la paleta con ese hex y
sustituye `--brand-*` en el bloque `html.theme-eysa` de `styles.scss` por los tonos reales.

### Añadir un tercer tema

1. Genera su paleta con el comando anterior y guárdala como `src/m3-theme-<nombre>.scss`
   (exportando `$<nombre>-theme`).
2. En `styles.scss`: `@use` del nuevo archivo + un bloque `html.theme-<nombre> { @include
   mat.all-component-themes(...); --brand-navy: ...; ... }` con sus `--brand-*` propios.
3. Añade el logo a `src/assets/logos/` y regístralo en `THEME_LOGO_PATHS` en
   `app-theme.config.ts`.
4. Añade `'<nombre>'` al tipo `AppTheme`.

No hace falta tocar `shell.component`, `login.component` ni ningún otro componente: todos
leen el logo desde `THEME_LOGO_PATH` y los colores desde las CSS custom properties
(`--brand-*`), que cambian solas según la clase puesta en `<html>`.

## Estructura

```
src/app/
  core/
    models/        interfaces que reflejan los Contracts (DTOs/Requests) del backend
    services/       un servicio HTTP por entidad + AuthService
    interceptors/    JWT (auth.interceptor) y manejo de errores (error.interceptor)
    guards/          authGuard (protege las rutas salvo /login)
  layout/shell/      toolbar + menú lateral de navegación
  features/
    login/           formulario de login (POST /login)
    users/           CRUD de usuarios (api/users); el propio formulario de edición asigna/quita roles (api/user-roles)
    roles/           CRUD de roles (api/roles)
    parkings/        CRUD de parkings (api/parkings, Id de tipo string)
    parking-statuses/ solo lectura (api/parking-statuses)
    counter-configs/  CRUD de configuración de contadores (api/counter-configs)
  shared/confirm-dialog/  diálogo de confirmación genérico (usado en los borrados)
```

## Notas de mapeo con el backend

- Todos los controladores CRUD exigen rol `admin` (`[Authorize(Roles = "admin")]`; los nombres
  de rol se guardan en minúsculas por convención); el login guarda el JWT y lo añade a cada
  petición vía `authInterceptor`.
- `UserRolesController.Update` solo permite cambiar `Active` — al desmarcar un rol en la
  edición de usuario, el front elimina la asignación (`DELETE`) en vez de solo desactivarla;
  al volver a marcar un rol que ya tuvo asignación inactiva, la reactiva (`PUT active:true`)
  en vez de duplicarla.
- `ParkingStatusesController` no expone Create/Update/Delete — su listado es de solo lectura.
- `Parking.Id` y `CounterConfig.Idpk`/`CounterId` son claves de negocio (`string`), no GUID;
  quedan de solo lectura al editar, igual que hace el backend (no se puede reasignar el Id).
