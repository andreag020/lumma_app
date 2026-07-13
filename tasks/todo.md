# TODO — Lumma MVP

> Checklist generado con la skill **planning-and-task-breakdown**. Cada tarea
> incluye objetivo, criterios de aceptación (≤3), verificación, dependencias,
> archivos y tamaño. Orden = dependencias primero. Ver [`plan.md`](./plan.md).
>
> Stack: **Expo (React Native + TypeScript)** · expo-router · Zustand · expo-sqlite.

Tamaños: XS (1 archivo) · S (1–2) · M (3–5 feature slice) · L (5–8) · XL (dividir).

---

## Fase 0 — Fundaciones ✅ COMPLETADA (Checkpoint A)

### [x] T1 · Andamiaje del proyecto Expo — `S`
Proyecto Expo (blank-typescript) con expo-router y dependencias base.
- **Aceptación:** ✅ estructura `app/` con router; deps declaradas (expo-router, expo-sqlite, expo-secure-store, zustand); `npx expo config` resuelve.
- **Verificación:** ✅ `npx expo config --type public` OK; `npm run typecheck` limpio.
- **Archivos:** `package.json`, `app.json`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`.

### [x] T2 · Tema Lumma — `S`
Tokens de color noche, tipografía y acentos de luz según la marca.
- **Aceptación:** ✅ tema oscuro (índigo/ciruela) + acentos (dorado/marfil/lavanda/lima) como tokens; aplicado en layout raíz y home.
- **Verificación:** ✅ typecheck; home renderiza «Lumma» sobre fondo noche.
- **Depende de:** T1 · **Archivos:** `src/core/theme/theme.ts`.

### [x] T3 · Capa SQLite — `M`
Apertura de base, migraciones por `user_version` y esquema de las 4 tablas.
- **Aceptación:** ✅ crea profile / daily_entry / daily_content / ads_config; migración v1 idempotente; `wipeAllData()` para borrado.
- **Verificación:** ✅ typecheck; migración validada por revisión de esquema. *(Ejecución en dispositivo: verificación manual.)*
- **Depende de:** T1 · **Archivos:** `src/core/db/database.ts`.

### [x] T4 · Modelos + repositorios — `M`
Modelos puros (dominio ↔ fila) y repositorios CRUD.
- **Aceptación:** ✅ cada modelo tiene `xToRow`/`xFromRow`; repos con upsert/consulta; sin lógica en componentes.
- **Verificación:** ✅ `npm test` verde — 5 pruebas de round-trip de modelos.
- **Depende de:** T3 · **Archivos:** `src/models/*`, `src/repositories/*`, `test/models/models.test.ts`.

> ✅ **Checkpoint A alcanzado** — typecheck limpio + tests verdes + config Expo válida.

---

## Fase 1 — Ritual básico

### [ ] T5 · Onboarding local — `M`
Flujo sin cuenta: elegir signo, hora de notificación, idioma y módulos; guardar perfil con `saveProfile`.
- **Aceptación:** onboarding se completa en ≤60 s y persiste el perfil; al reabrir no se repite; explica qué se guarda.
- **Verificación:** store de perfil + `getProfile()` tras reinicio; recorrido en Expo Go.
- **Depende de:** T4, T2 · **Archivos:** `app/onboarding.tsx`, `src/stores/profileStore.ts`.

### [x] T6 · Contenido diario empaquetado + service — `M`
Assets JSON cargados a SQLite (`bulkInsertContent`) y consultados por signo+fecha, con respaldo determinista. Generación por lotes offline con Claude Haiku 4.5.
- **Aceptación:** ✅ `contentService.getDailyContent` devuelve contenido por (signo, fecha) con respaldo si falta la fecha; `seedContent` idempotente; sin llamadas de red en la app.
- **Verificación:** ✅ typecheck; sembrado en arranque (`_layout`); script `generate:content` valida sintaxis y guardia de API key.
- **Depende de:** T4 · **Archivos:** `assets/content/content.json`, `src/services/contentService.ts`, `scripts/generate-content.mjs`.

> **Hosting / API key:** la app no tiene backend; la clave de Claude vive solo en el script offline (`scripts/generate-content.mjs`), nunca en el bundle. El contenido se empaqueta como asset JSON.

### [ ] T7 · Pantalla Home — `M`
Astrología del signo + frase del día desde contenido local, con acceso al registro.
- **Aceptación:** home muestra astrología+frase del día para el signo del perfil; botón claro para registrar ánimo.
- **Verificación:** render con perfil de prueba → textos esperados (jest-expo).
- **Depende de:** T5, T6 · **Archivos:** `app/index.tsx`.

> ✅ **Checkpoint B** — onboarding → home end-to-end en Expo Go.

---

## Fase 2 — Registro y firmamento (core)

### [ ] T8 · Registro de ánimo — `M`
Color de mood + etiqueta + nota opcional; persistir con `upsertEntry` (un registro por día).
- **Aceptación:** registro en ≤3 toques desde home; guarda `DailyEntry` de hoy; editar el existente si ya hay.
- **Verificación:** guardar → `getEntryByDate` confirma persistencia.
- **Depende de:** T7 · **Archivos:** `app/mood.tsx`.

### [ ] T9 · Firmamento personal — `L`
Visualización anual (Skia) donde cada registro es un punto de luz en su fecha, con el color del mood.
- **Aceptación:** N registros → N puntos en fechas correctas; fluido (≥55 fps) con ~365 puntos en un canvas.
- **Verificación:** test de mapeo fecha→posición + prueba manual con dataset de un año.
- **Depende de:** T8 · **Archivos:** `app/firmament.tsx`, `src/features/firmament/*`.

> ✅ **Checkpoint C** — registrar ánimo crea el punto correcto en el firmamento.

---

## Fase 3 — Retención y monetización

### [ ] T10 · Notificaciones locales — `M`
`expo-notifications` programa una notificación diaria a la hora del perfil, con texto breve desde contenido local.
- **Aceptación:** se programa a la hora elegida; texto calmado desde contenido local; sin push remoto.
- **Verificación:** prueba manual dispara a la hora fijada; test de construcción del texto.
- **Depende de:** T5, T6 · **Archivos:** `src/services/notificationService.ts`.

### [ ] T11 · Ajustes + privacidad — `M`
Ajustes: borrar todos los datos (`wipeAllData`), ver qué se guarda, gestionar consentimiento.
- **Aceptación:** «borrar mis datos» limpia SQLite y vuelve a onboarding; texto de privacidad visible; consentimiento persistido.
- **Verificación:** borrar deja tablas vacías; render de la pantalla.
- **Depende de:** T4 · **Archivos:** `app/settings.tsx`.

### [ ] T12 · AdMob básico — `S`
`react-native-google-mobile-ads`: banner discreto en pantallas secundarias. Requiere *dev build* (no Expo Go). Sin interstitials.
- **Aceptación:** banner solo en pantallas secundarias; nunca en el flujo principal; respeta `adsRemoved` y consentimiento.
- **Verificación:** dev build con IDs de test de AdMob; el flujo principal no muestra anuncios.
- **Depende de:** T11 · **Archivos:** `src/services/adsService.ts`.

> ✅ **Checkpoint D** — notificación dispara · borrar datos funciona · banner solo en secundarias.

---

## Resumen de ejecución

| Fase | Tareas | Estado | Entregable verificable |
|---|---|---|---|
| 0 Fundaciones | T1–T4 | ✅ **Hecho** | Typecheck + tests verdes, config Expo válida |
| 1 Ritual básico | T5–T7 | Pendiente | Onboarding → astrología + frase diaria |
| 2 Core | T8–T9 | Pendiente | Registro de ánimo → firmamento personal |
| 3 Retención | T10–T12 | Pendiente | Notificaciones + privacidad + anuncios |

**Siguiente acción sugerida:** ejecutar **T5** (onboarding) o **T6** (contenido diario de muestra). Recomiendo empezar por **T6** para tener contenido real que mostrar en Home.
