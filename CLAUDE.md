# CLAUDE.md

Guía para trabajar con Claude Code en **sipv2-admin-app**, el frontend Angular de SIPV2.
Lee también `README.md` (arranque, temas de marca, estructura, notas de mapeo con el
backend) — este archivo no lo repite, solo añade lo que un asistente necesita para
trabajar en el código sin romper convenciones.

## Qué es esto

Angular 18 standalone (sin NgModules) + Angular Material, consumiendo la API
`SIPV2.AdminAppApi` (repo hermano `sipv2-admin-app-api`, .NET). Es el panel de
administración interno de un sistema de parkings: usuarios/roles, catálogo de parkings y
contadores, y pantallas de consulta (estado de integración, informe ERP, ingresos
diarios, ocupación actual).

## Arrancar en desarrollo

```bash
npm install
npm start        # ng serve, http://localhost:4200
```

Necesita el backend corriendo en `https://localhost:7119` (`dotnet run --launch-profile
https` desde `SIPV2.AdminAppApi/`) — `proxy.conf.js` reenvía `/api/*` y el `POST /login`
hacia ahí. Antes de reconstruir/reiniciar el backend, si estaba corriendo, mátalo primero
(`SIPV2.AdminAppApi.exe` puede dejar bloqueado `SIPV2.DataModels.dll` y romper el build).
Antes de asumir que un puerto está libre o caído, compruébalo (`netstat -ano | grep -E
":4200|:7119" | grep LISTENING`) en vez de suponerlo.

Verificación antes de dar por buena una tarea: `tsc --noEmit` no basta —
`ng build --configuration development` detecta errores de plantilla que tsc no ve.

## Convenciones que hay que seguir SIEMPRE

- **Standalone, no NgModules.** Cada componente declara sus propios `imports` de
  Material. Un `mat-form-field` que se ve sin borde/control casi siempre es un
  sub-módulo de Material olvidado en `imports` (p. ej. `MatInputModule`) — el error de
  consola suele ser una pista falsa, mira `imports` primero.
- **Signals**, no `BehaviorSubject`/estado mutable a mano: `signal()` para estado,
  `computed()` para derivados (filtros, listas visibles, permisos de menú). Los
  servicios HTTP siguen devolviendo `Observable` (RxJS), consumidos con `.subscribe()`
  o `finalize()` para apagar loaders.
- **Un servicio por entidad** en `core/services/`, siempre con el mismo esqueleto
  (`getAll/getById/create/update/delete`, `baseUrl` desde `environment.apiUrl` +
  `/api/<recurso>`), y un comentario apuntando al controller del backend que refleja
  (ver `parking.service.ts` como plantilla). Los modelos en `core/models/` son
  interfaces que reflejan los DTOs/Requests del backend **uno a uno**, no entidades EF.
- **`Parking.Id` y `CounterConfig.Idpk`/`CounterId` son claves de negocio `string`**, no
  GUID — de solo lectura al editar, igual que en el backend.
- **Borrado lógico**: "eliminar" en la UI casi siempre es `Active = false` vía backend,
  no un DELETE físico (excepción documentada: quitar un rol de un usuario si nunca tuvo
  asignación activa, ver notas de `UserRolesController` en el README).
- **Roles y visibilidad de menú**: los grupos de `shell.component.ts` (`navGroups`) se
  filtran por rol (`security`, `config`, `status`); el rol `admin` ve siempre todo. Si
  añades una pantalla nueva bajo un grupo existente, no hace falta tocar el backend para
  la visibilidad del menú — pero sí confirma que el controller correspondiente autoriza
  ese rol (ver el gotcha de `[Authorize]`/`FallbackPolicy` en el CLAUDE.md del backend:
  cualquier `[Authorize]` en un controller lo saca de la política global, así que cada
  uno debe repetir explícitamente sus roles permitidos).
- **Catálogos con tabla propia** (p. ej. `ParkingType`, antes una constante
  `PARKING_TYPES` en el frontend): se cargan con un servicio + `signal` en `ngOnInit` del
  componente que los usa, y se resuelven con una función `xxxLabel(id, lista)` en el
  modelo — no hardcodees valores que ya tengan tabla en BD.
- **Fecha/hora**: locale `es-ES` fijado en `app.config.ts`, formato `DD/MM/YYYY` forzado
  vía `AppDateAdapter` (`core/date/app-date-adapter.ts`) porque el formato `numeric` de
  `es-ES` no rellena con ceros. No cambies el locale de un datepicker puntual sin pasar
  por ese adapter.
- **Interceptors** (`core/interceptors/`): `authInterceptor` añade el JWT salvo en
  `/login`; `errorInterceptor` centraliza 401 (logout + redirect + aviso) y mensajes de
  negocio del backend (`error.error.message`). No dupliques manejo de errores HTTP
  dentro de un componente salvo un caso muy específico.
- **Gráficas propias en SVG**, sin librerías de charting (decisión explícita del
  usuario). Patrón: `viewBox` fijo como "lienzo de diseño", `width:100%; height:auto`
  para que escale como una imagen, y cualquier posición de tooltip expresada en % del
  viewBox (no en píxeles) para que no se desalinee al escalar. Ver
  `features/daily-totals/daily-totals-chart-dialog.component.ts`.
- **`[style.width.%]` con valores que puedan ser negativos**: haz `clamp` antes de
  enlazar (`Math.min(100, Math.max(0, valor))`). Un ancho CSS inválido se ignora y el
  navegador cae al ancho por defecto del bloque, lo que puede pintar una barra
  completamente llena en vez de vacía — bug real ya visto en `occupancy-list.component`.
- **Paleta de colores**: acento de marca (`--brand-*` en `styles.scss`, varía por tema)
  para series únicas; paleta semántica de estado fija y separada del acento de marca
  para crítico/aviso/bien (`#d03b3b` / `#fab219` / `#0ca30c`), no reutilices el acento de
  marca para semáforos de estado.
- **Tema de marca**: hay dos temas completos (`esparking`/`eysa`), seleccionados en
  build-time por una única constante (`core/config/app-theme.config.ts`). No añadas un
  selector de tema en la UI ni condiciones `if (theme === ...)` en componentes — todo se
  resuelve solo con la clase `theme-<nombre>` en `<html>` + variables CSS `--brand-*`;
  ver la sección "Tema visual" del README antes de tocar colores o logos.

## Estructura (resumen; detalle completo en el README)

```
src/app/
  core/{models,services,interceptors,guards,config,date}/
  layout/shell/        toolbar + menú lateral (navGroups con filtro por rol)
  features/<recurso>/  una carpeta por pantalla; lista + diálogo de formulario si aplica
  shared/               confirm-dialog, change-password-dialog, validators
```

Al añadir una pantalla nueva: modelo en `core/models/`, servicio en `core/services/`,
componente en `features/<nombre>/`, ruta con `loadComponent` + `title` en
`app.routes.ts`, y entrada en `navGroups` de `shell.component.ts` si debe aparecer en el
menú.

## Repo hermano

El backend vive en `sipv2-admin-app-api` (repo separado, no submódulo). Antes de asumir
la forma de un DTO o el rol exigido por un endpoint, mira el controller/DTO real ahí en
vez de inferirlo — los modelos del frontend deben reflejarlo exactamente, sin campos de
más ni de menos.
