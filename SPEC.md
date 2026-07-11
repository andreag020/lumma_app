# Especificación — Lumma (MVP)

> Documento generado aplicando la skill **spec-driven-development** del plugin
> `agent-skills`. Estructura de seis secciones: Objetivo, Comandos, Estructura,
> Estilo de código, Estrategia de pruebas y Límites.
>
> Fuentes: [`concepto-de-marca.md`](./concepto-de-marca.md) y
> [`consideraciones-tecnicas-y-herramientas-lumma.md`](./consideraciones-tecnicas-y-herramientas-lumma.md).

## Supuestos declarados

Antes de escribir la spec, estos supuestos se hacen explícitos (cámbialos si no aplican):

1. **Framework: Flutter.** El doc técnico admite «Flutter o React Native/Expo». Se elige Flutter por sus animaciones/partículas (clave para el *firmamento personal*) y una sola base Android/iOS. *Decisión revisable.*
2. **Sin cuenta ni backend en el MVP.** Arquitectura local-first: SQLite + preferencias locales. Render/Resend/Paddle/Clerk quedan fuera del MVP.
3. **Contenido astrológico y frases empaquetados** dentro de la app para 30–60 días (JSON de assets), generados por lotes con Claude Haiku 4.5 fuera de la app. Sin llamadas a la API en tiempo de ejecución.
4. **Plataforma objetivo inicial: Android** (AdMob + compra in-app nativa). iOS se habilita después con la misma base.
5. **Idioma inicial: español.** Estructura preparada para i18n.

---

## 1. Objetivo

**Qué se construye:** una app móvil de astrología serena y registro emocional. La usuaria abre Lumma como ritual diario opcional: recibe astrología por signo, una frase breve, registra su ánimo (color + etiqueta + nota opcional) y ve su **firmamento personal** — un mapa anual donde cada día registrado es un punto de luz.

**Por qué:** validar si las personas regresan cada día por astrología, calma y su firmamento personal, con costo de infraestructura mínimo y monetización rápida por anuncios.

**Métricas de éxito del MVP:**

- Retención D1/D7: la usuaria vuelve a registrar ánimo al menos una vez en la primera semana.
- El onboarding local (sin cuenta) se completa en menos de 60 s.
- Registro de ánimo diario en ≤ 3 toques desde la pantalla principal.
- Firmamento personal renderiza fluido (≥ 55 fps) con un año de registros (~365 puntos).
- Cero servicios externos obligatorios en runtime (todo funciona offline salvo anuncios).

**Alcance del MVP (Fase 1):** onboarding local · perfil sin cuenta · registro de ánimo · frase diaria · astrología por signo · firmamento personal anual · notificaciones locales · AdMob básico.

**Fuera de alcance (fases posteriores):** contenido remoto, compra para quitar anuncios, analytics, backend en Render, cuenta opcional, sincronización entre dispositivos.

---

## 2. Comandos

> Comandos de referencia para un proyecto Flutter. Se materializan al ejecutar la tarea de andamiaje (`flutter create`).

```bash
# Configuración inicial
flutter pub get                 # Instalar dependencias

# Desarrollo
flutter run                     # Ejecutar en dispositivo/emulador conectado
flutter run -d chrome           # Vista rápida en web (solo UI, no plugins nativos)

# Calidad
flutter analyze                 # Linter estático (analysis_options.yaml)
dart format .                   # Formateo de código

# Pruebas
flutter test                    # Tests unitarios y de widgets
flutter test --coverage         # Con reporte de cobertura (coverage/lcov.info)
flutter test integration_test   # Tests de integración end-to-end

# Build
flutter build apk --release     # APK Android release
flutter build appbundle         # Bundle para Play Store
```

---

## 3. Estructura del proyecto

```
lumma_app/
├── SPEC.md                          # Este documento
├── README.md
├── concepto-de-marca.md             # Fuente de marca
├── consideraciones-tecnicas-...md   # Fuente técnica
├── tasks/
│   ├── plan.md                      # Plan de implementación (skill planning)
│   └── todo.md                      # Checklist de tareas
├── .claude/settings.json            # Marketplace + plugin agent-skills
├── pubspec.yaml                     # Dependencias Flutter
├── analysis_options.yaml            # Reglas del linter
├── assets/
│   └── content/                     # JSON de astrología y frases (30–60 días)
├── lib/
│   ├── main.dart                    # Entry point + tema + rutas
│   ├── app.dart                     # MaterialApp / router raíz
│   ├── core/
│   │   ├── theme/                   # Colores noche, tipografía, tokens de luz
│   │   ├── db/                      # SQLite: apertura, migraciones, DAOs
│   │   └── utils/
│   ├── models/                      # Profile, DailyEntry, DailyContent, AdsConfig
│   ├── repositories/                # Acceso a datos (perfil, registros, contenido)
│   ├── features/
│   │   ├── onboarding/              # Selección de signo, hora, idioma, módulos
│   │   ├── home/                    # Astrología + frase + acceso a registro
│   │   ├── mood/                    # Registro de ánimo (color, etiqueta, nota)
│   │   ├── firmament/               # Firmamento personal (visualización anual)
│   │   ├── settings/               # Ajustes, borrar datos, consentimiento ads
│   │   └── notifications/           # Programación de notificaciones locales
│   └── services/
│       ├── content_service.dart     # Carga contenido diario por signo/fecha
│       ├── notification_service.dart
│       └── ads_service.dart         # Integración AdMob
└── test/                            # Espejo de lib/ para unit y widget tests
```

---

## 4. Estilo de código

Convenciones Dart/Flutter estándar (`dart format`, lints de `flutter_lints`).

- **Nombres:** clases `PascalCase`; variables/funciones `camelCase`; archivos `snake_case.dart`; constantes `lowerCamelCase`.
- **Modelos inmutables** con `copyWith`, `fromMap`/`toMap` para SQLite.
- **Estado:** un solo enfoque en toda la app (Riverpod recomendado; alternativa: Provider). Sin lógica de negocio dentro de widgets.
- **Widgets pequeños y componibles**; extraer sub-widgets antes que métodos `_buildX` largos.
- **Sin strings hardcodeados** de UI: centralizar en un archivo de textos preparado para i18n.

Ejemplo de modelo (patrón a seguir):

```dart
class DailyEntry {
  final String entryId;
  final DateTime date;
  final String moodColor;      // hex, p. ej. "#C9A227"
  final String moodLabel;
  final String? note;
  final String? dailyPhraseId;
  final String? astrologyMessageId;

  const DailyEntry({
    required this.entryId,
    required this.date,
    required this.moodColor,
    required this.moodLabel,
    this.note,
    this.dailyPhraseId,
    this.astrologyMessageId,
  });

  Map<String, Object?> toMap() => {
        'entry_id': entryId,
        'date': date.toIso8601String(),
        'mood_color': moodColor,
        'mood_label': moodLabel,
        'note_optional': note,
        'daily_phrase_id': dailyPhraseId,
        'astrology_message_id': astrologyMessageId,
      };

  factory DailyEntry.fromMap(Map<String, Object?> m) => DailyEntry(
        entryId: m['entry_id'] as String,
        date: DateTime.parse(m['date'] as String),
        moodColor: m['mood_color'] as String,
        moodLabel: m['mood_label'] as String,
        note: m['note_optional'] as String?,
        dailyPhraseId: m['daily_phrase_id'] as String?,
        astrologyMessageId: m['astrology_message_id'] as String?,
      );
}
```

**Dirección visual (de la marca):** fondo azul noche/índigo/ciruela profunda; acentos de luz en dorado suave, marfil, verde-lima tenue o lavanda; constelaciones en líneas finas; brillos difusos y gradientes atmosféricos en lugar de efectos agresivos. Nunca interstitials en el flujo principal.

---

## 5. Estrategia de pruebas

- **Framework:** `flutter_test` (unit + widget) e `integration_test` (E2E).
- **Ubicación:** `test/` refleja la estructura de `lib/`; los E2E en `integration_test/`.
- **Cobertura objetivo del MVP:** ≥ 70 % en `models/`, `repositories/` y `services/` (lógica pura y de datos). UI cubierta por widget tests de las pantallas clave.
- **Prioridades de prueba:**
  1. DAOs de SQLite: escribir/leer perfil y registros diarios; migraciones.
  2. `content_service`: seleccionar contenido correcto por signo + fecha.
  3. Registro de ánimo: guardar un registro se refleja en el firmamento.
  4. Firmamento: N registros → N puntos de luz en las fechas correctas.
- **Verificación manual:** ejecutar el flujo onboarding → home → registro → firmamento en emulador antes de cada checkpoint.

---

## 6. Límites (decisiones de tres niveles)

**Siempre (Always):**

- Mantener todo local-first: los datos de la usuaria viven en el dispositivo (SQLite + secure storage para fecha de nacimiento si se pide).
- Ofrecer «borrar mis datos» desde ajustes y explicar en onboarding qué se guarda.
- Reutilizar contenido por día+signo (no generar por usuaria en runtime).
- Preferir selección manual de signo sobre pedir fecha de nacimiento completa.
- Notificaciones breves, calmadas y previsibles.

**Preguntar primero (Ask first):**

- Introducir cualquier dependencia de red obligatoria (backend, API en runtime).
- Pedir fecha de nacimiento completa u otros datos sensibles.
- Añadir un nuevo servicio externo (Render, Resend, Paddle, Clerk) o cuentas de usuario.
- Cambiar el framework (Flutter → RN/Expo) o el motor de estado.
- Introducir compras in-app o cambiar el modelo de monetización.

**Nunca (Never):**

- Interstitials agresivos en el flujo principal (rompen la atmósfera de calma).
- Enviar datos emocionales/personales a servicios externos sin consentimiento explícito.
- Llamar a la API de Claude en tiempo real por usuaria (solo generación por lotes offline).
- Crear cuentas obligatorias o flujos de login/recuperación en el MVP.
- Guardar datos sensibles en texto plano expuesto a backups/logs inseguros.
