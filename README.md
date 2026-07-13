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
- **El contenido** (astrología + frases) se genera **por lotes, fuera de la app**, con Claude Haiku 4.5 (Batch API), y se empaqueta como `assets/content/content.json`, que la app lee localmente. No hay llamadas a la API de Claude en tiempo de ejecución.

Generar el contenido completo (requiere tu clave, se ejecuta en tu máquina):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
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
- ✅ **Fase 2 (Core):** registro de ánimo (paleta fija de 8 colores) y firmamento personal anual (Skia). *(Checkpoint C — código y pruebas verificados; falta tu confirmación viéndolo en el teléfono)*
- ⏳ **Fase 3:** notificaciones, ajustes/privacidad y AdMob.

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
