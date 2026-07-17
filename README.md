# Lumma

**Lumma** es una marca de astrología y calma diseñada como un ritual nocturno personal: un firmamento propio donde la guía astrológica (constelaciones) y el ánimo diario (luciérnagas) se convierten en un mapa de luces. La app entrega astrología diaria, una frase breve, registro de ánimo y la visualización de un firmamento personal, con una arquitectura **local-first** de bajo costo.

## Documentación

| Documento | Contenido |
|---|---|
| [`SPEC.md`](./SPEC.md) | Especificación del MVP (objetivo, comandos, estructura, estilo, pruebas, límites). |
| [`tasks/plan.md`](./tasks/plan.md) | Plan de implementación: fases, dependencias, riesgos y decisiones. |
| [`tasks/todo.md`](./tasks/todo.md) | Checklist de tareas (T1–T12) con criterios de aceptación. |
| [`concepto-de-marca.md`](./concepto-de-marca.md) | Concepto de marca: visión, territorio emocional, símbolos y propuesta. |
| [`consideraciones-tecnicas-y-herramientas-lumma.md`](./consideraciones-tecnicas-y-herramientas-lumma.md) | Arquitectura local-first, stack y herramientas. |

## Stack (MVP)

- **App móvil:** Expo (React Native + TypeScript) · expo-router
- **Estado:** Zustand
- **Persistencia local:** expo-sqlite + expo-secure-store (datos sensibles)
- **Notificaciones:** expo-notifications (locales, sin servidor)
- **Monetización:** Google AdMob vía `react-native-google-mobile-ads` (Fase 3, requiere dev build)
- **Backend:** ninguno al inicio (opcional: microservicio en Render)
- **IA:** Claude Haiku 4.5 para generación de contenido en lote (Batch API), fuera de la app

## Arquitectura y hosting

Lumma es **local-first**: **no hay backend ni servidor que hostear**.

- **La app** corre en el teléfono de cada usuaria; se distribuye por Google Play (y luego App Store).
- **Los datos** de la usuaria viven solo en su dispositivo (SQLite). No salen del teléfono.
- **La API key de Claude** vive **solo** en el script de generación offline (`scripts/generate-content.mjs`), en tu máquina o en un secreto de CI — **nunca dentro de la app**. Incrustarla en el bundle permitiría extraerla del APK.
- **El contenido** (astrología + frases) se genera **por lotes, fuera de la app**, con Claude Haiku 4.5 (Batch API), y se empaqueta como `assets/content/content.json` como respaldo embebido (primer arranque sin red). No hay llamadas a la API de Claude en tiempo de ejecución.
- **Fundamentado en astronomía real:** el script calcula, para cada fecha, la posición real de los astros (signo que transita el Sol, signo y fase de la Luna, y los signos de Mercurio, Venus y Marte) con `astronomy-engine` — cálculo puro en Node, sin dependencias nativas ni impacto en el bundle. Esos datos reales se le pasan a Claude para que la lectura esté anclada al cielo del día. *(Las posiciones son reales; la interpretación astrológica es texto generado, como en cualquier horóscopo.)*

**Generación automática, semanal (recomendado):** [`.github/workflows/generate-content.yml`](./.github/workflows/generate-content.yml) corre el **sábado** (dos días antes de que arranque la semana el lunes) — y a mano desde la pestaña *Actions* — regenera `assets/content/content.json` con **14 días** de lecturas (la semana entrante + una semana extra de margen, por si el cron falla o se atrasa dos sábados seguidos) y hace dos cosas con el resultado:

1. Lo commitea al repo (privado) como respaldo embebido en la próxima build de la app.
2. Publica **solo ese archivo JSON** (nunca el código) en **GitHub Pages** — que es público aunque el repo sea privado — para que la app instalada lo descargue directamente. Así el contenido se renueva cada semana **sin publicar una nueva versión en Play Store**: la app hace un fetch de fondo al abrir (`src/services/contentService.ts#refreshRemoteContent`), como mucho una vez al día, con `INSERT OR REPLACE` en SQLite; si no hay red, sigue con lo que ya tenía. La clave de Claude nunca sale del entorno seguro de GitHub Actions.

Requiere dos configuraciones únicas, una sola vez:
- **Secreto de la clave:** *Settings → Secrets and variables → Actions → New repository secret* → nombre `ANTHROPIC_API_KEY`.
- **Habilitar Pages:** *Settings → Pages → Build and deployment → Source: "GitHub Actions"*.

**Generación manual (opcional, en tu máquina):** crea un archivo `.env` en la raíz del proyecto (ya está en `.gitignore`, nunca se sube) con:

```
ANTHROPIC_API_KEY=sk-ant-...
```

y corre:

```bash
npm run generate:content -- --days 30 --start 2026-07-13
```

## Cómo ejecutar

Requiere Node 18+ y la app **Expo Go** en tu teléfono (Android/iOS).

> **Sobre la versión de Expo (SDK 54):** Expo Go de las tiendas solo soporta *una* versión de SDK a la vez, y tarda semanas en aprobar cada versión nueva. El proyecto está fijado a **Expo SDK 54**, la versión vigente en Play Store/App Store, para que Expo Go recién descargada abra el proyecto sin errores de «incompatibilidad». Si ves ese error, casi siempre significa que tu Expo Go es más nueva/vieja que el `expo` de `package.json` — iguala ambas.

```bash
npm install --legacy-peer-deps   # instalar dependencias
npx expo start                   # abre un QR: escanéalo con Expo Go
```

Otros comandos útiles:

```bash
npm run typecheck   # comprobar tipos (tsc --noEmit)
npm test            # pruebas de lógica (Jest)
```

### Estado de desarrollo

- ✅ **Fase 0 (Fundaciones):** proyecto Expo, tema noche, base SQLite con migraciones, modelos y repositorios, pruebas de modelos. *(Checkpoint A)*
- ✅ **Fase 1 (Ritual básico):** contenido diario, onboarding (signo + hora de notificación), pantalla Home con astrología y frase del día. *(Checkpoint B)*
- ✅ **Fase 2 (Core):** registro de ánimo (paleta fija de 12 colores) y firmamento personal anual (Skia). *(Checkpoint C)*
- ✅ **Fase 3:** notificaciones locales ✅ · ajustes/gestión de cuenta ✅ (`app/settings.tsx`: editar signo/apodo/horario, recordatorio de ánimo independiente, borrar todos los datos) · AdMob ✅ (código completo — banner discreto en Ánimo/Firmamento/Ajustes, nunca en Home; respeta consentimiento GDPR y `ads_removed`; pendiente de probar en un *dev build* real, ya que Expo Go no soporta este módulo nativo).
- 🎨 **Pulido visual** (a pedido de la usuaria, tras probar en dispositivo): luces ambientales tipo luciérnaga/estrella que titilan con un ciclo de intensidad propio, independiente de su desplazamiento, y líneas finas de constelación que conectan luces cercanas y se desvanecen solas (`src/components/AmbientSky.tsx`, Skia + Reanimated) detrás del contenido en Home/Onboarding/Registro de ánimo; glifos zodiacales (♈♉♊…) en los chips de signo; micro-interacción de escala al tocar botones y chips principales (`src/components/AnimatedPressable.tsx`); Home aparece con una entrada escalonada (encabezado → tarjeta → acciones, cada una con su propio desvanecimiento) cada vez que se vuelve a ella, p. ej. al guardar cambios o volver desde Ajustes. Misma paleta de siempre — sin colores nuevos.

Ver el detalle y la siguiente tarea en [`tasks/todo.md`](./tasks/todo.md).

## Desarrollo con Claude Code

Este repositorio está configurado para usar el plugin **[agent-skills](https://github.com/addyosmani/agent-skills)** de Addy Osmani, que aporta 24 skills de ingeniería para todo el ciclo de desarrollo (spec, plan, build, verify, review, ship).

La configuración vive en [`.claude/settings.json`](./.claude/settings.json) y se aplica automáticamente al abrir el proyecto con Claude Code:

```json
{
  "extraKnownMarketplaces": {
    "addy-agent-skills": {
      "source": { "source": "github", "repo": "addyosmani/agent-skills" }
    }
  },
  "enabledPlugins": {
    "agent-skills@addy-agent-skills": true
  }
}
```

- `extraKnownMarketplaces` registra el marketplace `addy-agent-skills` (equivale a `/plugin marketplace add addyosmani/agent-skills`).
- `enabledPlugins` activa el plugin en el proyecto (equivale a `/plugin install agent-skills@addy-agent-skills`).

Si al abrir el proyecto en el CLI de Claude Code las skills no cargan automáticamente, ejecuta una vez:

```
/plugin marketplace add addyosmani/agent-skills
```

### Skills incluidas

- **Define:** interview-me, idea-refine, spec-driven-development
- **Plan:** planning-and-task-breakdown
- **Build:** incremental-implementation, test-driven-development, context-engineering, source-driven-development, doubt-driven-development, frontend-ui-engineering, api-and-interface-design
- **Verify:** browser-testing-with-devtools, debugging-and-error-recovery
- **Review:** code-review-and-quality, code-simplification, security-and-hardening, performance-optimization
- **Ship:** git-workflow-and-versioning, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, observability-and-instrumentation, shipping-and-launch
