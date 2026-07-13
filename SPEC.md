# Especificación — Lumma (MVP)

> Documento generado aplicando la skill **spec-driven-development** del plugin
> `agent-skills`. Estructura de seis secciones: Objetivo, Comandos, Estructura,
> Estilo de código, Estrategia de pruebas y Límites.
>
> Fuentes: [`concepto-de-marca.md`](./concepto-de-marca.md) y
> [`consideraciones-tecnicas-y-herramientas-lumma.md`](./consideraciones-tecnicas-y-herramientas-lumma.md).

## Decisiones de stack (resueltas)

1. **Framework: Expo (React Native + TypeScript).** El doc técnico admite «Flutter o React Native/Expo». Se elige Expo porque una persona sin experiencia móvil puede **previsualizar la app real en su teléfono con Expo Go (escaneando un QR)**, sin instalar toolchain nativo; además el código TS se puede verificar en cualquier entorno con Node. Trade-off aceptado: las animaciones del firmamento se resuelven con Skia/Reanimated en lugar del canvas de Flutter.
2. **Navegación: expo-router** (rutas por archivos). **Estado: Zustand** (mínimo).
3. **Sin cuenta ni backend en el MVP.** Local-first: `expo-sqlite` + `expo-secure-store` para datos sensibles. Render/Resend/Paddle/Clerk quedan fuera del MVP.
4. **Contenido astrológico y frases empaquetados** como assets (JSON, 30–60 días), generados por lotes con Claude Haiku 4.5 fuera de la app. Sin llamadas a la API en runtime.
5. **Plataforma inicial: Android** (AdMob + compra in-app nativa). iOS con la misma base después.
6. **Idioma inicial: español.** Estructura preparada para i18n.

> Nota sobre anuncios: `react-native-google-mobile-ads` requiere un *dev build* (EAS) — no funciona dentro de Expo Go. Solo aplica en la fase de monetización (Fase 3).

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

**Alcance del MVP:** onboarding local · perfil sin cuenta · registro de ánimo · frase diaria · astrología por signo · firmamento personal anual · notificaciones locales · AdMob básico.

**Fuera de alcance (fases posteriores):** contenido remoto, compra para quitar anuncios, analytics, backend en Render, cuenta opcional, sincronización entre dispositivos.

---

## 2. Comandos

```bash
# Configuración inicial
npm install --legacy-peer-deps   # Instalar dependencias (peer deps de Expo)

# Desarrollo
npx expo start                   # Servidor de desarrollo (QR para Expo Go)
npx expo start --android         # Abrir en emulador/dispositivo Android

# Calidad
npm run typecheck                # tsc --noEmit
npx expo config --type public    # Validar app.json + plugins

# Pruebas
npm test                         # Jest (lógica pura: modelos, servicios)

# Build (fase de release, requiere cuenta EAS)
npx eas build -p android         # Dev build / APK con módulos nativos (AdMob)
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
├── app.json                         # Config de Expo (nombre, scheme, plugins)
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # TypeScript (strict)
├── jest.config.js                   # Jest (ts-jest, entorno node)
├── assets/                          # Iconos, splash y contenido empaquetado
│   └── content/                     # JSON de astrología y frases (30–60 días)
├── app/                             # Rutas (expo-router, file-based)
│   ├── _layout.tsx                  # Layout raíz: tema + init de la base local
│   ├── index.tsx                    # Home (o redirección a onboarding)
│   ├── onboarding.tsx               # Selección de signo, hora, idioma, módulos
│   ├── mood.tsx                     # Registro de ánimo
│   ├── firmament.tsx                # Firmamento personal
│   └── settings.tsx                 # Ajustes, borrar datos, consentimiento
├── src/
│   ├── core/
│   │   ├── theme/theme.ts           # Colores noche, tipografía, tokens de luz
│   │   └── db/database.ts           # SQLite: apertura, migraciones, wipe
│   ├── models/                      # Profile, DailyEntry, DailyContent, AdsConfig
│   ├── repositories/                # Acceso a datos (perfil, registros, contenido)
│   ├── stores/                      # Zustand (perfil, sesión de UI)
│   └── services/                    # content, notifications, ads
└── test/                            # Pruebas (espejo de src/)
```

---

## 4. Estilo de código

Convenciones TypeScript/React Native estándar.

- **Nombres:** componentes y tipos `PascalCase`; variables/funciones `camelCase`; archivos de módulo `camelCase.ts`; componentes de ruta según expo-router.
- **Tipos explícitos** en fronteras públicas (props, retornos de repos/servicios). `strict` activado en `tsconfig`.
- **Modelos puros y serializables:** cada modelo tiene tipo de dominio (camelCase), tipo de fila SQLite (snake_case) y funciones `xToRow` / `xFromRow`. No importan módulos nativos → testeables en Node.
- **Estado:** Zustand para estado global; sin lógica de datos dentro de componentes (va en `repositories/` y `services/`).
- **Componentes pequeños y componibles**; extraer sub-componentes antes que funciones de render largas.
- **Sin strings de UI hardcodeados dispersos:** centralizar textos preparados para i18n.

Ejemplo del patrón de modelo (real, en `src/models/dailyEntry.ts`):

```ts
export interface DailyEntry {
  entryId: string;
  date: string;          // "YYYY-MM-DD" (un registro por día)
  moodColor: string;     // hex, p. ej. "#E5C46B"
  moodLabel: string;
  note: string | null;
  dailyPhraseId: string | null;
  astrologyMessageId: string | null;
}

export function dailyEntryToRow(e: DailyEntry): DailyEntryRow { /* … */ }
export function dailyEntryFromRow(r: DailyEntryRow): DailyEntry { /* … */ }
```

**Dirección visual (de la marca):** fondo azul noche/índigo/ciruela profunda; acentos de luz en dorado suave, marfil, verde-lima tenue o lavanda; constelaciones en líneas finas; brillos difusos y gradientes atmosféricos en lugar de efectos agresivos. Nunca interstitials en el flujo principal. Tokens en `src/core/theme/theme.ts`.

---

## 5. Estrategia de pruebas

- **Framework:** Jest. Lógica pura (modelos, servicios, mapeos) con **ts-jest** en entorno Node. Pruebas de componentes adoptarán **jest-expo** cuando existan pantallas.
- **Ubicación:** `test/` refleja la estructura de `src/`.
- **Cobertura objetivo del MVP:** ≥ 70 % en `models/`, `repositories/` y `services/` (lógica pura y de datos).
- **Prioridades de prueba:**
  1. Round-trip de modelos (dominio ↔ fila SQLite). ✅ *implementado en Checkpoint A.*
  2. `content_service`: seleccionar contenido correcto por signo + fecha.
  3. Registro de ánimo: guardar un registro se refleja en el firmamento.
  4. Firmamento: N registros → N puntos en las fechas correctas.
- **Verificación manual:** `npx expo start` → Expo Go en el teléfono; recorrer onboarding → home → registro → firmamento antes de cada checkpoint.

---

## 6. Límites (decisiones de tres niveles)

**Siempre (Always):**

- Mantener todo local-first: los datos de la usuaria viven en el dispositivo (`expo-sqlite` + `expo-secure-store` para fecha de nacimiento si se pide).
- Ofrecer «borrar mis datos» desde ajustes y explicar en onboarding qué se guarda.
- Reutilizar contenido por día+signo (no generar por usuaria en runtime).
- Preferir selección manual de signo sobre pedir fecha de nacimiento completa.
- Notificaciones breves, calmadas y previsibles.

**Preguntar primero (Ask first):**

- Introducir cualquier dependencia de red obligatoria (backend, API en runtime).
- Pedir fecha de nacimiento completa u otros datos sensibles.
- Añadir un nuevo servicio externo (Render, Resend, Paddle, Clerk) o cuentas de usuario.
- Cambiar el framework o el motor de estado.
- Introducir compras in-app o cambiar el modelo de monetización.

**Nunca (Never):**

- Interstitials agresivos en el flujo principal (rompen la atmósfera de calma).
- Enviar datos emocionales/personales a servicios externos sin consentimiento explícito.
- Llamar a la API de Claude en tiempo real por usuaria (solo generación por lotes offline).
- Crear cuentas obligatorias o flujos de login/recuperación en el MVP.
- Guardar datos sensibles en texto plano expuesto a backups/logs inseguros.
