# Plan de implementación — Lumma MVP

> Generado aplicando la skill **planning-and-task-breakdown** del plugin
> `agent-skills`. Basado en [`SPEC.md`](../SPEC.md). Construir de abajo hacia
> arriba (datos → modelos → repos → features) y por **cortes verticales**
> (cada fase deja la app funcionando y verificable).

## Grafo de dependencias

```
Andamiaje + tema
        │
     SQLite (db + migraciones)
        │
   Modelos ── Repositorios
        │
        ├──> Onboarding (perfil local)         ── slice vertical 1
        ├──> Contenido diario (assets JSON)
        │         │
        │      Home (astrología + frase)        ── slice vertical 2
        │
        ├──> Registro de ánimo                  ── slice vertical 3
        │         │
        │      Firmamento personal              ── slice vertical 4
        │
        ├──> Notificaciones locales             ── slice vertical 5
        ├──> Ajustes + borrar datos + consent   ── slice vertical 6
        └──> AdMob básico                       ── slice vertical 7
```

## Fases y checkpoints

### Fase 0 — Fundaciones
- **T1** Andamiaje Flutter + dependencias + linter
- **T2** Tema Lumma (colores noche, tipografía, tokens de luz)
- **T3** Capa SQLite (apertura, migraciones, esquema de las 4 tablas)
- **T4** Modelos + repositorios (Profile, DailyEntry, DailyContent, AdsConfig)
- ✅ **Checkpoint A — COMPLETADO:** `npm run typecheck` limpio, `npm test` verde (round-trip de los 4 modelos), `npx expo config` resuelve con el plugin router, y la app arranca al layout raíz con el tema noche. *(La ejecución en emulador/Expo Go queda para verificación manual: este entorno no tiene dispositivo.)*

### Fase 1 — Ritual básico (slices 1–2)
- **T5** Onboarding local (signo, hora de notificación, idioma, módulos) → guarda perfil
- **T6** Empaquetar contenido diario (JSON de astrología + frases, 30 días de muestra) + `content_service`
- **T7** Home: muestra astrología del signo y frase del día desde contenido local
- ✅ **Checkpoint B:** flujo onboarding → home funciona end-to-end en emulador; home muestra contenido correcto por signo/fecha.

### Fase 2 — Registro y firmamento (slices 3–4, corazón del producto)
- **T8** Registro de ánimo (color + etiqueta + nota opcional) → persiste `DailyEntry`
- **T9** Firmamento personal: visualización anual donde cada registro es un punto de luz
- ✅ **Checkpoint C:** registrar un ánimo crea un punto en el firmamento en la fecha correcta; N registros → N puntos.

### Fase 3 — Retención y monetización (slices 5–7)
- **T10** Notificaciones locales según hora elegida, texto desde contenido local
- **T11** Ajustes: borrar datos, ver qué se guarda, consentimiento de anuncios
- **T12** AdMob: banner discreto en pantallas secundarias (sin interstitials)
- ✅ **Checkpoint D:** notificación programada dispara; borrar datos limpia SQLite; banner aparece solo en pantallas secundarias.

## Análisis de riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Rendimiento del firmamento con ~365 puntos | Alto (es el core visual) | Renderizar con `@shopify/react-native-skia` (un canvas), no 365 componentes; probar con dataset de un año en Checkpoint C. |
| Datos sensibles (fecha de nacimiento) | Medio/legal | Preferir selección manual de signo; `expo-secure-store` si se pide fecha; opción de borrado. |
| Cumplimiento de consentimiento de anuncios (GDPR) | Medio | Integrar flujo de consentimiento de AdMob antes de servir anuncios en regiones aplicables. |
| Contenido insuficiente (se acaban los 30–60 días) | Medio | Empaquetar buffer amplio; Fase 2 del roadmap añade JSON remoto actualizable. |
| **Expo Go de las tiendas va detrás del SDK más nuevo** | Alto (bloquea probar en el teléfono) | Expo Go en Play Store/App Store solo soporta **una** versión de SDK a la vez, y la aprobación de cada SDK nuevo en las tiendas se retrasa semanas. El proyecto se fijó a **Expo SDK 54** (la versión vigente en las tiendas en jul-2026) en vez del SDK 57 recién publicado en npm, para que Expo Go recién descargada pueda abrir el proyecto sin necesidad de un dev build. Antes de subir de SDK en el futuro, confirmar qué versión soporta Expo Go en las tiendas. |
| **Dependencias «ocultas» de librerías nativas** | Medio (crashea en runtime, no en typecheck) | `@shopify/react-native-skia` exporta desde un barril que carga módulos de video internamente, y esos módulos referencian `react-native-reanimated`/`react-native-worklets` aunque nuestra app no usa video ni animaciones de Skia — sin esas dos librerías instaladas, la app crashea al abrir con «react-native-reanimated is not installed!». Se agregaron ambas (versiones bundled en Expo Go SDK 54: reanimated ~4.1.1, worklets 0.5.1). `babel-preset-expo` detecta `react-native-worklets` automáticamente — no hace falta `babel.config.js` manual. Lección: instalar una dependencia nueva no garantiza que sus propias dependencias opcionales/transitivas estén cubiertas; conviene abrir la app en el teléfono tras cada dependencia nueva, no solo confiar en el typecheck. |
| AdMob no corre en Expo Go | Bajo (tardío) | Solo afecta la Fase 3; usar un *dev build* (EAS) cuando se integren anuncios. |

## Decisiones (resueltas)

Estas eran preguntas abiertas; se resolvieron con recomendación (usuaria sin experiencia móvil, prioriza poder previsualizar):

1. **Framework:** ✅ **Expo (React Native + TypeScript)** — permite previsualizar en el teléfono con Expo Go sin toolchain nativo.
2. **Estado:** ✅ **Zustand** (mínimo, apto para principiantes).
3. **Plataforma:** ✅ **Android primero**, iOS con la misma base después.
4. **Contenido diario:** ✅ **Lo genera el equipo** (frases/astrología en español); la usuaria revisa el tono.
5. **Paleta de moods:** ✅ **Fija por defecto** en el MVP; personalizable en Fase 2.
