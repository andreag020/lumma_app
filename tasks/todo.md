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

### [x] T5 · Onboarding local — `M`
Flujo sin cuenta: elegir signo (chips) y hora de notificación (chips preestablecidas); apodo opcional. Idioma y módulos quedan fijos (decisión ya resuelta en `plan.md`), sin pantalla adicional, para cumplir el objetivo de ≤60 s.
- **Aceptación:** ✅ onboarding guarda el perfil vía `useProfileStore.save`; explica en pantalla qué se guarda («solo en tu teléfono»); redirige a Home al terminar.
- **Verificación:** ✅ typecheck limpio; `Index` redirige a `/onboarding` cuando `getProfile()` devuelve `null` (recorrido manual en Expo Go pendiente de confirmar por la usuaria).
- **Depende de:** T4, T2 · **Archivos:** `app/onboarding.tsx`, `src/stores/profileStore.ts`, `src/core/utils/id.ts`.

### [x] T6 · Contenido diario empaquetado + service — `M`
Assets JSON cargados a SQLite (`bulkInsertContent`) y consultados por signo+fecha, con respaldo determinista. Generación por lotes offline con Claude Haiku 4.5.
- **Aceptación:** ✅ `contentService.getDailyContent` devuelve contenido por (signo, fecha) con respaldo si falta la fecha; `seedContent` idempotente; sin llamadas de red en la app.
- **Verificación:** ✅ typecheck; sembrado en arranque (`_layout`); script `generate:content` valida sintaxis y guardia de API key.
- **Depende de:** T4 · **Archivos:** `assets/content/content.json`, `src/services/contentService.ts`, `scripts/generate-content.mjs`.

> **Hosting / API key:** la app no tiene backend; la clave de Claude vive solo en el script offline (`scripts/generate-content.mjs`), nunca en el bundle. El contenido se empaqueta como asset JSON.

### [x] T7 · Pantalla Home — `M`
Astrología del signo + frase del día desde contenido local, con acceso al registro. `app/index.tsx` hace de puerta: sin perfil redirige a onboarding; con perfil muestra el contenido del día vía `getDailyContent`.
- **Aceptación:** ✅ home muestra astrología+frase del día para el signo del perfil; botón «Registrar mi ánimo de hoy» navega a `/mood` (placeholder — el registro real es T8).
- **Verificación:** ✅ typecheck limpio. *(Sin `jest-expo` en el proyecto — ver decisión en el commit de SDK 54 — la verificación de render queda para prueba manual en Expo Go.)*
- **Depende de:** T5, T6 · **Archivos:** `app/index.tsx`, `app/mood.tsx` (placeholder de T8).

> ✅ **Checkpoint B — código completo:** onboarding → home construido y verificado por typecheck/tests. *Pendiente de confirmar en el teléfono real (Expo Go) por la usuaria.*

---

## Fase 2 — Registro y firmamento (core)

### [x] T8 · Registro de ánimo — `M`
Paleta fija de 8 moods (color + etiqueta); nota opcional; persiste con `upsertEntry` vía `entryStore` (un registro por día, editable).
- **Aceptación:** ✅ 3 toques desde Home (botón → elegir color → Guardar); guarda `DailyEntry` de hoy; reabrir el mismo día precarga el registro existente para editarlo. Home muestra el mood de hoy si ya se registró.
- **Verificación:** ✅ `npm run typecheck` limpio, `npm test` verde.
- **Depende de:** T7 · **Archivos:** `app/mood.tsx`, `src/stores/entryStore.ts`, `src/models/moodPalette.ts`.

### [x] T9 · Firmamento personal — `L`
Visualización anual con `@shopify/react-native-skia` (un solo Canvas nativo, no 365 componentes de React Native) donde cada registro es un punto de luz en su fecha, con el color del mood. Fondo con puntos tenues para los 365/366 días del año.
- **Aceptación:** ✅ mapeo fecha→posición puro y testeado (`src/features/firmament/layout.ts`); N registros → N puntos en fechas correctas; Skia confirmado como bundled en Expo Go para SDK 54 (ver `bundledNativeModules.json`).
- **Verificación:** ✅ 9 pruebas unitarias del mapeo verdes (`test/features/firmament/layout.test.ts`); `npm run typecheck` limpio (valida el uso real de la API de Skia — `Canvas`/`Circle`/`BlurMask`); `npx expo config` sigue resolviendo en SDK 54 tras instalar la dependencia.
- **Depende de:** T8 · **Archivos:** `app/firmament.tsx`, `src/features/firmament/layout.ts`.

> ✅ **Checkpoint C — código verificado:** registrar ánimo → aparece el punto correcto en el firmamento. *(Render real en pantalla queda pendiente de tu confirmación en Expo Go — este entorno no tiene teléfono.)*

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
| 1 Ritual básico | T5–T7 | ✅ **Hecho** | Onboarding → astrología + frase diaria |
| 2 Core | T8–T9 | ✅ **Hecho** | Registro de ánimo → firmamento personal |
| 3 Retención | T10–T12 | Pendiente | Notificaciones + privacidad + anuncios |

**Siguiente acción sugerida:** probar en tu teléfono el recorrido completo — onboarding → Home → registrar ánimo → ver el punto en el firmamento — y confirmar que se ve y se siente bien. Después, seguir con **T10** (notificaciones locales) para cerrar el ritual diario.
