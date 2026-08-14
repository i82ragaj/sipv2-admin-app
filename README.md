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

`ng serve` usa `proxy.conf.json` para reenviar `/api/*` y `/login` a
`https://localhost:7119`. Esto evita tener que tocar el backend: **`Program.cs` no define
ninguna política CORS**, así que sin el proxy (o sin configurar CORS en el backend) el
navegador bloquearía las llamadas al abrir la app directamente contra otro origen/puerto.

Para producción, edita `src/environments/environment.production.ts` con la URL real de la
API antes de compilar (`npm run build`).

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
    users/           CRUD de usuarios (api/users)
    roles/           CRUD de roles (api/roles)
    user-roles/       asignación de roles a usuarios (api/user-roles) — el PUT solo activa/desactiva
    parkings/        CRUD de parkings (api/parkings, Id de tipo string)
    parking-statuses/ solo lectura (api/parking-statuses)
    counter-configs/  CRUD de configuración de contadores (api/counter-configs)
  shared/confirm-dialog/  diálogo de confirmación genérico (usado en los borrados)
```

## Notas de mapeo con el backend

- Todos los controladores CRUD exigen rol `Admin` (`[Authorize(Roles = "Admin")]`); el login
  guarda el JWT y lo añade a cada petición vía `authInterceptor`.
- `UserRolesController.Update` solo permite cambiar `Active` — el formulario de edición de
  asignaciones únicamente expone ese campo, igual que el backend.
- `ParkingStatusesController` no expone Create/Update/Delete — su listado es de solo lectura.
- `Parking.Id` y `CounterConfig.Idpk`/`CounterId` son claves de negocio (`string`), no GUID;
  quedan de solo lectura al editar, igual que hace el backend (no se puede reasignar el Id).
