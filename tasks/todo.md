# TODO — Lumma MVP

> Checklist generado con la skill **planning-and-task-breakdown**. Cada tarea
> incluye objetivo, criterios de aceptación (≤3), verificación, dependencias,
> archivos y tamaño. Orden = dependencias primero. Ver [`plan.md`](./plan.md).

Tamaños: XS (1 archivo) · S (1–2) · M (3–5 feature slice) · L (5–8) · XL (dividir).

---

## Fase 0 — Fundaciones

### [ ] T1 · Andamiaje del proyecto Flutter — `S`
Crear el proyecto Flutter base con dependencias y linter configurados.
- **Aceptación:** `flutter run` arranca a pantalla vacía; `flutter analyze` sin errores; dependencias base declaradas (sqflite, path, riverpod, flutter_local_notifications, google_mobile_ads).
- **Verificación:** `flutter pub get && flutter analyze && flutter run`.
- **Depende de:** —
- **Archivos:** `pubspec.yaml`, `analysis_options.yaml`, `lib/main.dart`, `lib/app.dart`.

### [ ] T2 · Tema Lumma — `S`
Definir tokens de color noche, tipografía y acentos de luz según la dirección visual de marca.
- **Aceptación:** tema oscuro (índigo/ciruela) aplicado globalmente; acentos dorado/marfil/lavanda disponibles como tokens; tipografía clara configurada.
- **Verificación:** la pantalla vacía muestra fondo noche y tipografía correcta.
- **Depende de:** T1
- **Archivos:** `lib/core/theme/*`.

### [ ] T3 · Capa SQLite — `M`
Apertura de base de datos, migraciones y esquema de las 4 tablas (perfil, registros diarios, contenido diario, config de anuncios).
- **Aceptación:** DB se crea con las 4 tablas; migración v1 idempotente; DAOs básicos de insert/query.
- **Verificación:** `flutter test test/core/db/` verde (crear DB, insertar y leer una fila por tabla).
- **Depende de:** T1
- **Archivos:** `lib/core/db/*`, `test/core/db/*`.

### [ ] T4 · Modelos + repositorios — `M`
Modelos inmutables y repositorios para perfil, registros, contenido y config de anuncios.
- **Aceptación:** cada modelo tiene `fromMap`/`toMap`/`copyWith`; repos exponen CRUD mínimo; sin lógica en widgets.
- **Verificación:** `flutter test test/models test/repositories` verde (round-trip map↔objeto y persistencia).
- **Depende de:** T3
- **Archivos:** `lib/models/*`, `lib/repositories/*`, tests espejo.

> ✅ **Checkpoint A** — `flutter analyze` limpio + tests de datos verdes + app arranca con tema.

---

## Fase 1 — Ritual básico

### [ ] T5 · Onboarding local — `M`
Flujo sin cuenta: elegir signo, hora de notificación, idioma y módulos activos; guardar perfil local.
- **Aceptación:** onboarding se completa en ≤60 s y persiste el perfil; al reabrir la app no se repite; explica qué datos se guardan.
- **Verificación:** widget test del flujo + reinicio de app conserva el perfil.
- **Depende de:** T4, T2
- **Archivos:** `lib/features/onboarding/*`.

### [ ] T6 · Contenido diario empaquetado + service — `M`
Empaquetar JSON de astrología y frases (30 días de muestra por signo) y cargarlo por signo+fecha.
- **Aceptación:** `content_service` devuelve el contenido correcto dado (signo, fecha); sin llamadas de red; fallback si falta la fecha.
- **Verificación:** `flutter test test/services/content_service_test.dart` con casos por signo/fecha.
- **Depende de:** T4
- **Archivos:** `assets/content/*`, `lib/services/content_service.dart`, `pubspec.yaml` (assets).

### [ ] T7 · Pantalla Home — `M`
Mostrar astrología del signo y frase del día desde contenido local, con acceso al registro.
- **Aceptación:** home muestra astrología+frase del día para el signo del perfil; botón claro para registrar ánimo.
- **Verificación:** widget test: perfil Leo + fecha X → textos esperados.
- **Depende de:** T5, T6
- **Archivos:** `lib/features/home/*`.

> ✅ **Checkpoint B** — onboarding → home end-to-end en emulador.

---

## Fase 2 — Registro y firmamento (core)

### [ ] T8 · Registro de ánimo — `M`
Registrar el día con color de mood + etiqueta + nota opcional; persistir `DailyEntry`.
- **Aceptación:** registro en ≤3 toques desde home; guarda un `DailyEntry` con fecha de hoy; un registro por día (editar el existente).
- **Verificación:** widget test de guardado + repo confirma persistencia.
- **Depende de:** T7
- **Archivos:** `lib/features/mood/*`.

### [ ] T9 · Firmamento personal — `L`
Visualización anual donde cada registro es un punto de luz en su fecha, con color del mood.
- **Aceptación:** N registros → N puntos en las fechas correctas; render fluido (≥55 fps) con ~365 puntos usando canvas/`CustomPainter`.
- **Verificación:** test de mapeo fecha→posición + prueba manual con dataset de un año.
- **Depende de:** T8
- **Archivos:** `lib/features/firmament/*`.

> ✅ **Checkpoint C** — registrar ánimo crea el punto correcto en el firmamento.

---

## Fase 3 — Retención y monetización

### [ ] T10 · Notificaciones locales — `M`
Programar notificación diaria según la hora del perfil, con texto breve desde contenido local.
- **Aceptación:** notificación se programa a la hora elegida; texto calmado desde contenido local; sin push remoto.
- **Verificación:** prueba manual en emulador dispara a la hora fijada; test de construcción del texto.
- **Depende de:** T5, T6
- **Archivos:** `lib/features/notifications/*`, `lib/services/notification_service.dart`.

### [ ] T11 · Ajustes + privacidad — `M`
Pantalla de ajustes: borrar todos los datos, ver qué se guarda, gestionar consentimiento de anuncios.
- **Aceptación:** «borrar mis datos» limpia SQLite y vuelve a onboarding; texto de privacidad visible; estado de consentimiento persistido.
- **Verificación:** test: borrar datos deja las tablas vacías; widget test de la pantalla.
- **Depende de:** T4
- **Archivos:** `lib/features/settings/*`.

### [ ] T12 · AdMob básico — `S`
Banner discreto en pantallas secundarias (historial/ajustes), respetando consentimiento. Sin interstitials.
- **Aceptación:** banner solo en pantallas secundarias; nunca en el flujo principal; respeta `ads_removed` y consentimiento.
- **Verificación:** prueba manual con IDs de test de AdMob; el flujo principal no muestra anuncios.
- **Depende de:** T11
- **Archivos:** `lib/services/ads_service.dart`, integración en pantallas secundarias.

> ✅ **Checkpoint D** — notificación dispara · borrar datos funciona · banner solo en secundarias.

---

## Resumen de ejecución

| Fase | Tareas | Entregable verificable |
|---|---|---|
| 0 Fundaciones | T1–T4 | App arranca, datos persisten, tests verdes |
| 1 Ritual básico | T5–T7 | Onboarding → astrología + frase diaria |
| 2 Core | T8–T9 | Registro de ánimo → firmamento personal |
| 3 Retención | T10–T12 | Notificaciones + privacidad + anuncios |

**Siguiente acción sugerida:** resolver las preguntas abiertas de `plan.md` (framework, estado, plataforma) y ejecutar **T1**.
