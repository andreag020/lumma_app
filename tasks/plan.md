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
- ✅ **Checkpoint A:** `flutter analyze` limpio, `flutter test` verde para DAOs y modelos, la app arranca a una pantalla vacía con el tema aplicado.

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
| Rendimiento del firmamento con ~365 puntos | Alto (es el core visual) | Usar `CustomPainter`/canvas, no 365 widgets; probar con dataset de un año en Checkpoint C. |
| Datos sensibles (fecha de nacimiento) | Medio/legal | Preferir selección manual de signo; secure storage si se pide fecha; opción de borrado. |
| Cumplimiento de consentimiento de anuncios (GDPR) | Medio | Integrar flujo de consentimiento de AdMob antes de servir anuncios en regiones aplicables. |
| Contenido insuficiente (se acaban los 30–60 días) | Medio | Empaquetar buffer amplio; Fase 2 del roadmap añade JSON remoto actualizable. |
| Elección de framework aún abierta | Bajo (temprano) | Decisión aislada en Fase 0; cambiar antes de T5 es barato. |

## Preguntas abiertas

1. ¿Confirmamos **Flutter** o prefieres **React Native/Expo**? (afecta todo el código, no la spec)
2. ¿Motor de estado: **Riverpod** (recomendado) u otro?
3. ¿Plataforma inicial solo **Android**, o Android + iOS desde el arranque?
4. ¿El contenido diario de muestra lo genero yo (frases/astrología en español) o lo aportas tú?
5. ¿Paleta de moods fija por defecto o personalizable desde el MVP?
