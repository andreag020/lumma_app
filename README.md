# Lumma

**Lumma** es una marca de astrología y calma diseñada como un ritual nocturno personal: un firmamento propio donde la guía astrológica (constelaciones) y el ánimo diario (luciérnagas) se convierten en un mapa de luces. La app entrega astrología diaria, una frase breve, registro de ánimo y la visualización de un firmamento personal, con una arquitectura **local-first** de bajo costo.

## Documentación

| Documento | Contenido |
|---|---|
| [`concepto-de-marca.md`](./concepto-de-marca.md) | Concepto de marca: visión, territorio emocional, símbolos y propuesta de producto. |
| [`consideraciones-tecnicas-y-herramientas-lumma.md`](./consideraciones-tecnicas-y-herramientas-lumma.md) | Arquitectura local-first, stack recomendado y herramientas de desarrollo. |

## Stack (MVP)

- **App móvil:** Flutter o React Native/Expo
- **Persistencia local:** SQLite + almacenamiento de preferencias
- **Notificaciones:** locales (sin servidor)
- **Monetización:** Google AdMob (banner y rewarded)
- **Backend:** ninguno al inicio (opcional: microservicio en Render)
- **IA:** Claude Haiku 4.5 para generación en lote (Batch API)

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
