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
Flujo sin cuenta: elegir signo (chips) y hora de notificación; apodo opcional. Idioma y módulos quedan fijos (decisión ya resuelta en `plan.md`), sin pantalla adicional, para cumplir el objetivo de ≤60 s.
- **Selector de hora (actualizado dos veces a pedido de la usuaria):** al principio se usaban chips de horas preestablecidas para evitar sumar una dependencia nativa justo tras resolver un problema de compatibilidad de SDK; luego pidió poder elegir cualquier hora a su conveniencia, así que se probó `@react-native-community/datetimepicker` — pero el picker nativo del sistema operativo rompía con el resto de la interfaz (formato/estilo ajeno a la marca). Se reemplazó por un selector propio con diseño de Lumma: dos ruedas (hora/minuto) con `FlatList` + snap, sin depender del picker del SO ni de una dependencia nativa nueva (`src/components/TimePickerField.tsx`, reutilizado también en Ajustes, T11).
- **Bug corregido — rueda estática:** tras instalar `react-native-gesture-handler` para el zoom del firmamento (T9), la rueda dejó de responder al arrastre. Causa: el `Modal` de React Native abre su propia raíz nativa, separada del `GestureHandlerRootView` que envuelve la app en `app/_layout.tsx` — sin un `GestureHandlerRootView` propio *dentro* del `Modal`, ningún gesto (ni siquiera el scroll normal) se reconoce ahí. Es un problema documentado de la librería, no específico de esta app. Se corrigió envolviendo el contenido del `Modal` con su propio `GestureHandlerRootView` (mismo arreglo aplicado a los dos `Modal` del firmamento, T9, por el mismo motivo).
- **Aceptación:** ✅ onboarding guarda el perfil vía `useProfileStore.save`; explica en pantalla qué se guarda («solo en tu teléfono»); redirige a Home al terminar.
- **Verificación:** ✅ typecheck limpio; `Index` redirige a `/onboarding` cuando `getProfile()` devuelve `null`; selector de hora verificado visualmente en Expo web (el picker nativo en sí solo se puede probar en Expo Go, no en web).
- **Depende de:** T4, T2 · **Archivos:** `app/onboarding.tsx`, `src/stores/profileStore.ts`, `src/core/utils/id.ts`, `src/components/TimePickerField.tsx`.

### [x] T6 · Contenido diario empaquetado + service — `M`
Assets JSON cargados a SQLite (`bulkInsertContent`) y consultados por signo+fecha, con respaldo determinista. Generación por lotes offline con Claude Haiku 4.5.
- **Aceptación:** ✅ `contentService.getDailyContent` devuelve contenido por (signo, fecha) con respaldo si falta la fecha; `seedContent` idempotente; sin llamadas de red en la app.
- **Verificación:** ✅ typecheck; sembrado en arranque (`_layout`); script `generate:content` valida sintaxis y guardia de API key.
- **Depende de:** T4 · **Archivos:** `assets/content/content.json`, `src/services/contentService.ts`, `scripts/generate-content.mjs`.

> **Hosting / API key:** la app no tiene backend; la clave de Claude vive solo en el script offline (`scripts/generate-content.mjs`) y como secreto de GitHub Actions, nunca en el bundle. El contenido se empaqueta como asset JSON (respaldo para el primer arranque sin red) **y además** se sincroniza semanalmente: [`.github/workflows/generate-content.yml`](../.github/workflows/generate-content.yml) corre el sábado (dos días antes de que arranque la semana), regenera 14 días de lecturas (semana entrante + una de margen) y publica el JSON en GitHub Pages (público, aunque el repo es privado); la app lo descarga sola (`contentService.refreshRemoteContent`, ≤1 vez/día) sin necesitar una nueva versión en Play Store. El tono de las lecturas se rediseñó (a pedido de la usuaria) para sentirse como un horóscopo clásico de periódico — guía concreta del día por signo, no frases contemplativas abstractas.

### [x] T7 · Pantalla Home — `M`
Astrología del signo + frase del día desde contenido local, con acceso al registro. `app/index.tsx` hace de puerta: sin perfil redirige a onboarding; con perfil muestra el contenido del día vía `getDailyContent`.
- **Aceptación:** ✅ home muestra astrología+frase del día para el signo del perfil; botón «Registrar mi ánimo de hoy» navega a `/mood` (placeholder — el registro real es T8).
- **Verificación:** ✅ typecheck limpio. *(Sin `jest-expo` en el proyecto — ver decisión en el commit de SDK 54 — la verificación de render queda para prueba manual en Expo Go.)*
- **Transición más suave al volver de Ajustes (a pedido de la usuaria):** antes, guardar cambios o tocar la flecha de volver en Ajustes usaba `router.replace('/')`, que fuerza un remonte «duro» de Home (no siempre anima bien en `replace`) y además duplica la entrada de Home en el historial de navegación. Se cambió a `router.back()` — Ajustes solo se llega desde el ícono ⚙ de Home, así que siempre hay una pantalla a la que volver — que usa la transición nativa de «retroceder» del stack (más fluida y consistente entre iOS/Android). Para que la entrada escalonada (`FadeInDown` en cascada) se siga viendo cada vez que se vuelve a Home, y no solo la primera vez que se monta la pantalla, ahora se dispara con `useFocusEffect` (vía una `key` que remonta el bloque animado en cada enfoque de la pantalla), no con el montaje del componente.
- **Depende de:** T5, T6 · **Archivos:** `app/index.tsx`, `app/mood.tsx` (placeholder de T8).

> ✅ **Checkpoint B — código completo:** onboarding → home construido y verificado por typecheck/tests. *Pendiente de confirmar en el teléfono real (Expo Go) por la usuaria.*

---

## Fase 2 — Registro y firmamento (core)

### [x] T8 · Registro de ánimo — `M`
Paleta fija de moods (color + etiqueta) — ampliada de 8 a 12 a pedido de la usuaria (`src/models/moodPalette.ts`); nota opcional; persiste con `upsertEntry` vía `entryStore` (un registro por día, editable).
- **Aceptación:** ✅ 3 toques desde Home (botón → elegir color → Guardar); guarda `DailyEntry` de hoy; reabrir el mismo día precarga el registro existente para editarlo. Home muestra el mood de hoy si ya se registró.
- **Verificación:** ✅ `npm run typecheck` limpio, `npm test` verde.
- **Depende de:** T7 · **Archivos:** `app/mood.tsx`, `src/stores/entryStore.ts`, `src/models/moodPalette.ts`.

### [x] T9 · Firmamento personal — `L`
Visualización anual con `@shopify/react-native-skia` (un solo Canvas nativo, no 365 componentes de React Native) donde cada registro es un punto de luz en su fecha, con el color del mood. Fondo con puntos tenues para los 365/366 días del año.
- **Navegación entre años (a pedido de la usuaria):** selector de año en el encabezado (`{año} ▾`) que abre un dropdown modal — sin dependencias nativas nuevas, con `Modal`/`Pressable`/`ScrollView` de React Native puro, siguiendo el mismo criterio que el resto de la app (evitar pickers nativos). Lista de años desde 2024 (constante `FIRST_YEAR`) hasta el año actual, calculada en cada render — crece sola cada año que pasa. Por defecto siempre abre en el año en curso.
- **Tocar un punto muestra la nota (a pedido de la usuaria):** la nota que se registra junto con el ánimo se guardaba pero no aparecía en ningún lado. Cada punto del firmamento (no los de fondo) ahora es tocable: busca el más cercano al toque dentro de un radio cómodo (`HIT_RADIUS`, en espacio de datos — ver zoom abajo) y abre una tarjeta con la fecha completa en español (`formatLongDateEs`, sin depender de `Intl`), el color/etiqueta del ánimo y la nota (o «Sin nota ese día» si no hay). `FirmamentPoint` ahora incluye `note`.
- **Zoom y desplazamiento (a pedido de la usuaria, para tocar una luz con más precisión):** `react-native-gesture-handler` (`~2.28.0`, versión exacta empaquetada en Expo Go SDK 54) + gestos de pellizco/arrastre/doble-toque, aplicados como una transformación de un `Group` de Skia (más desplazamiento — la matemática de la composición se verificó contra el código fuente de `processTransformProps`/`processTransform3d` de `@shopify/react-native-skia`, no es una suposición). El radio de toque de cada punto se compara en espacio de datos (sin escalar), así que al hacer zoom el equivalente en pantalla crece — acertar se vuelve más fácil, no más difícil. Doble toque restablece el zoom. Requiere `GestureHandlerRootView` envolviendo la app (`app/_layout.tsx`).
- **Rediseño del zoom — crece hacia abajo, sin recortarse (a pedido de la usuaria):** la primera versión escalaba el contenido dentro de una caja de tamaño fijo con `overflow: hidden`, así que lo que sobresalía del zoom se recortaba. Se cambió a un diseño donde el propio contenedor visible crece en alto junto con el zoom (`useAnimatedStyle` atado al valor de escala), envuelto en un `ScrollView` para poder desplazarse y ver el resto cuando ya no entra en la pantalla. El origen de la transformación de Skia se movió del centro del canvas a la parte de arriba (`origin={vec(canvasWidth / 2, 0)}`), así el crecimiento es siempre hacia abajo — nunca hacia arriba, donde está el encabezado con el título y el selector de año. La superficie real de Skia se reserva de entrada con el alto máximo posible (`canvasHeight * MAX_SCALE`) para que el contenido escalado nunca choque con el borde del lienzo. Se quitó el desplazamiento vertical por gesto (ya no hace falta: el scroll de la pantalla cumple ese rol) y se quitó el texto de instrucciones bajo el firmamento, a pedido de la usuaria.
- **Aceptación:** ✅ mapeo fecha→posición puro y testeado (`src/features/firmament/layout.ts`); N registros → N puntos en fechas correctas; Skia confirmado como bundled en Expo Go para SDK 54 (ver `bundledNativeModules.json`); selector de año cambia el firmamento mostrado sin recargar la pantalla; tocar un punto abre su nota; pellizcar hace zoom, arrastrar desplaza, doble toque restablece.
- **Verificación:** ✅ pruebas unitarias del mapeo (incluida la conservación de `note`) y de `formatLongDateEs` verdes; `npm run typecheck` limpio (valida el uso real de la API de Skia — `Canvas`/`Circle`/`Group`/`BlurMask` — y de los gestos de `react-native-gesture-handler`); `npx expo config` sigue resolviendo en SDK 54. *La detección de toque y los gestos sobre el Canvas de Skia solo pueden confirmarse visualmente en Expo Go — este entorno no puede renderizar CanvasKit en el preview web, así que ni el toque ni el pellizco/arrastre se pudieron probar de forma visual, solo revisar que no lancen errores nuevos.*
- **Depende de:** T8 · **Archivos:** `app/firmament.tsx`, `src/features/firmament/layout.ts`.

> ✅ **Checkpoint C — código verificado:** registrar ánimo → aparece el punto correcto en el firmamento. *(Render real en pantalla queda pendiente de tu confirmación en Expo Go — este entorno no tiene teléfono.)*

---

## Fase 3 — Retención y monetización

### [x] T10 · Notificación de la frase diaria (estilo horóscopo de periódico) — `M`
`expo-notifications` programa **una notificación por cada uno de los próximos 21 días** (ventana móvil, no una sola repetitiva), cada una con la **lectura real del signo para esa fecha** — como la entrega diaria de un horóscopo de periódico, no un texto genérico. Sin servidor, sin push remoto (confirmado: Expo Go SDK 54 solo quitó el push remoto, las notificaciones locales siguen funcionando).
- **Rediseño (a pedido de la usuaria):** (1) el contenido ahora es la lectura real del signo (`shortAstrologyText` vía `getDailyContent`), con título `"{Signo} · tu lectura de hoy"` — no un mensaje genérico; (2) los horarios de onboarding se rebalancearon (`07:00, 08:00, 12:00, 18:00, 21:00`, default `08:00`) para no sesgar hacia la noche — muchas personas leen su lectura al empezar el día.
- **Límite técnico asumido:** iOS limita a 64 notificaciones locales pendientes por app; se usa una ventana de 21 días (con margen para el futuro recordatorio de ánimo de T11), que se renueva cada vez que se llama la función (Home la reprograma en cada apertura). Los días sin contenido bundleado se saltan en vez de inventar texto.
- **Nota honesta:** el contenido de muestra (`assets/content/content.json`) hoy solo tiene 1 día real por signo; hasta correr `npm run generate:content` con 30 días, las 21 notificaciones mostrarán la misma lectura (por el respaldo rotativo de `contentService`) — es el comportamiento esperado, no un bug.
- **Aceptación:** ✅ se programa a la hora del perfil (`SchedulableTriggerInputTypes.DATE`, una por fecha); no bloquea la app si se niega el permiso; se reprograma solo si la hora cambia (Home); solo cancela notificaciones de su propio canal, no todas; sin push remoto.
- **Verificación:** ✅ `npm run typecheck` limpio (validó la API real de `expo-notifications`: `identifier`, `trigger.channelId`/`DATE`); `npm test` verde — pruebas de `parseTime`, `buildPhraseNotificationContent` y `addDays` (lógica pura, sin el módulo nativo).
- **Depende de:** T5, T6 · **Archivos:** `src/services/notificationService.ts`, `src/services/notificationText.ts`, `src/core/utils/date.ts`.

### [x] T11 · Ajustes + gestión de cuenta — `M`
Menú de Ajustes (accesible desde el ícono ⚙ en Home) para gestionar la cuenta local: editar apodo, signo y horario de la lectura diaria, configurar un recordatorio de ánimo independiente, y borrar todos los datos.
- **Mi cuenta:** editar apodo, signo (chips) y horario de la frase diaria; «Guardar cambios» persiste el perfil y reprograma ambos recordatorios.
- **Recordatorio de ánimo (a pedido de la usuaria):** on/off + hora propia, independiente del recordatorio de la frase diaria (T10) — canal de Android separado (`daily-mood`, ver `scheduleMoodReminder` en `notificationService.ts`); como es un recordatorio genérico (no depende de contenido por fecha), usa un trigger `DAILY` repetitivo en vez de la ventana móvil de T10.
- **Privacidad y datos:** texto de qué se guarda (solo en el teléfono); «Borrar todos mis datos» (confirmación nativa) limpia SQLite (`wipeAllData`), el perfil en memoria (`profileStore.clear`) y vuelve a onboarding.
- **Aceptación:** ✅ «borrar mis datos» limpia SQLite y vuelve a onboarding; texto de privacidad visible; recordatorio de ánimo configurable de forma independiente al de la frase diaria (canal propio, no cancela `daily-phrase`); editar signo/apodo/horario y guardar persiste y reprograma notificaciones.
- **Verificación:** ✅ `npm run typecheck` limpio (migración v2 de `profile` con las columnas nuevas, tipos de `Profile`/`ProfileRow` actualizados); `npm test` verde (round-trip de `Profile` con los campos de recordatorio de ánimo); verificado visualmente en Expo web + Playwright (edición de signo/horario, toggle de ánimo revelando sus chips, botón de guardado con confirmación «Cambios guardados ✓»). *Nota: la confirmación nativa de «Borrar mis datos» usa `Alert.alert`, que no tiene efecto en el preview web (limitación de `react-native-web`, no de la app) — funciona normalmente en Expo Go.*
- **Depende de:** T4 · **Archivos:** `app/settings.tsx`, `app/index.tsx` (ícono de acceso), `src/core/constants.ts`, `src/models/profile.ts`, `src/core/db/database.ts` (migración v2), `src/repositories/profileRepository.ts`, `src/stores/profileStore.ts`, `src/services/notificationService.ts`.

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
| 3 Retención | T10–T12 | 🚧 T10 y T11 hechos | Notificaciones ✅ + ajustes/cuenta ✅ + anuncios ⏳ |

**Siguiente acción sugerida:** probar en tu teléfono el recorrido completo, incluyendo el nuevo menú de Ajustes (⚙ en Home) — editar signo/apodo/horario, activar el recordatorio de ánimo y confirmar «Borrar mis datos» — y luego seguir con T12 (AdMob) cuando quieras monetizar.
