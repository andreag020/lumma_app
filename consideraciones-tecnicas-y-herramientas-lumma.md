# Consideraciones técnicas y herramientas de desarrollo para Lumma

## Objetivo técnico

Lumma debe construirse con una arquitectura de costo mínimo, mantenimiento bajo y capacidad de monetización rápida mediante anuncios. Para lograrlo, la versión inicial debe priorizar procesamiento local, almacenamiento en el dispositivo y una experiencia personalizada sin depender de cuentas registradas ni de infraestructura compleja.[cite:152][cite:153]

La meta del MVP es entregar astrología diaria, frase diaria, registro de ánimo y visualización de un firmamento personal, usando el menor número posible de servicios externos. Esto reduce costos fijos, simplifica soporte y acelera el lanzamiento.[cite:117][cite:120][cite:153]

## Principios de arquitectura

La arquitectura técnica recomendada para Lumma es **local-first**. Eso significa que el perfil básico de la persona usuaria, sus preferencias, su historial emocional y la configuración de notificaciones deben vivir principalmente en el dispositivo, evitando un backend obligatorio en la primera versión.[cite:153][cite:161]

Este enfoque tiene cuatro ventajas principales:

- Menor costo mensual de infraestructura.
- Menor complejidad de desarrollo y soporte.
- Menor fricción para la usuaria, ya que no necesita crear cuenta.
- Mayor rapidez para validar retención y monetización antes de escalar.[cite:153][cite:161]

## Stack recomendado

| Capa | Recomendación | Motivo |
|---|---|---|
| App móvil | Flutter o React Native/Expo | Permiten construir rápido y mantener una sola base de código para Android e iOS. |
| Persistencia local | SQLite + almacenamiento local de preferencias | Ideal para historial, configuración y datos del firmamento personal.[cite:153] |
| Almacenamiento sensible | Secure Storage del dispositivo | Útil para proteger datos más delicados, como fecha de nacimiento si llegara a pedirse.[cite:153] |
| Notificaciones | Local notifications | No requieren servidor para el MVP. |
| Monetización | Google AdMob | Permite monetización con banner y rewarded ads, con soporte amplio para apps móviles.[cite:42][cite:31] |
| Backend | Ninguno al inicio, o microservicio en Render si se vuelve necesario | Mantiene costo cero o muy bajo mientras la app valida tracción. |
| IA | Claude Haiku 4.5 para generación en lote | Es la opción más barata dentro de Claude para tareas ligeras, y Batch API reduce el costo en 50%.[cite:140] |
| Pagos | Compra in-app nativa para quitar anuncios | Más simple que introducir una plataforma de pagos externa en el MVP. |

## Herramientas ya disponibles y cómo aprovecharlas

### Render

Render solo sería necesario si Lumma necesita en una segunda fase un backend liviano, por ejemplo para administrar contenido diario, actualizar frases sin nueva release o exponer un endpoint simple para sincronización futura. En la primera versión no es indispensable, porque la app puede funcionar con datos locales o contenido empaquetado en archivos internos.

### Resend

Resend no es prioritario en el MVP. Como Lumma no requiere registro con correo ni flujos de recuperación de cuenta, el envío de emails agregaría complejidad innecesaria sin aportar valor temprano.

### Paddle

Paddle tampoco es prioritario para una app móvil simple cuya monetización principal será publicidad y una compra única para quitar anuncios. En móvil, esa compra suele resolverse mejor con los sistemas nativos de la tienda. Paddle sería más relevante si Lumma en el futuro tuviera una versión web o un plan digital fuera del ecosistema móvil.

### Clerk

Clerk no se recomienda para la primera versión. La app puede personalizarse con un perfil local sin crear cuenta registrada, lo que disminuye fricción y reduce trabajo técnico asociado a autenticación, recuperación, soporte y cumplimiento.

### Claude

Claude sí puede ser útil si se usa con control. La recomendación es usarlo para generar contenido en lotes, no para producir respuestas únicas en tiempo real para cada usuaria. El uso de la API de Claude puede optimizarse con Batch API y prompt caching, y la documentación oficial de Anthropic muestra que la plataforma ofrece descuentos por procesamiento en lote.[cite:140]

## Recolección de datos sin cuenta

Lumma sí necesita recopilar información para personalizar astrología, notificaciones y experiencia visual, pero eso no obliga a crear una cuenta formal. La recomendación técnica es implementar un onboarding ligero que construya un perfil local del usuario.[cite:153][cite:161]

Datos mínimos recomendados:

| Dato | Necesidad | Recomendación |
|---|---|---|
| Signo zodiacal | Alta | Pedir selección manual para reducir sensibilidad de datos |
| Fecha de nacimiento | Opcional | Solo pedirla si se quiere automatizar cálculo del signo; guardar con cuidado.[cite:153] |
| Hora de notificación | Alta | Guardar localmente |
| Idioma | Media | Guardar localmente |
| Módulos activos | Alta | Guardar localmente |
| Paleta de moods | Media | Guardar localmente |
| Historial de ánimo y notas | Alta | Guardar en SQLite local.[cite:153] |

Si el objetivo es minimizar riesgos, conviene que el onboarding permita elegir directamente el signo en vez de pedir fecha de nacimiento completa. Eso reduce la sensibilidad de la información guardada y simplifica la política de privacidad.[cite:153]

## Modelo de datos sugerido

### Tabla de perfil local
- `user_id_local`
- `nickname`
- `zodiac_sign`
- `birth_date_optional`
- `notification_time`
- `language`
- `enabled_modules`
- `theme_preferences`

### Tabla de registros diarios
- `entry_id`
- `date`
- `mood_color`
- `mood_label`
- `note_optional`
- `daily_phrase_id`
- `astrology_message_id`

### Tabla de contenido diario
- `content_id`
- `date`
- `zodiac_sign`
- `short_astrology_text`
- `daily_phrase`
- `extended_text_optional`

### Tabla de configuración de anuncios
- `ads_removed`
- `consent_status`
- `last_consent_check`

## Notificaciones

La estrategia más barata es usar notificaciones locales. La app puede programarlas según la hora elegida por la usuaria y construir el texto a partir de contenido ya disponible en local o predescargado.

Esto evita un sistema de push remoto, elimina costos de backend y reduce dependencias. Para una experiencia como Lumma, además, es coherente que la notificación sea breve, calmada y previsible: una frase del día, una invitación a revisar el cielo o un recordatorio para registrar el ánimo.[cite:58][cite:74]

## Contenido astrológico y frases

La opción técnicamente más eficiente es generar contenido de manera anticipada. En vez de llamar a una API en cada apertura, conviene usar lotes de contenido por signo y por fecha.

Opciones recomendadas:

1. Contenido empaquetado dentro de la app para 30 o 60 días.
2. Archivo JSON remoto actualizable ocasionalmente.
3. Microservicio en Render solo si luego se requiere un panel de administración.
4. Generación en lote con Claude Haiku 4.5, aprovechando Batch API para abaratar costos.[cite:140]

La lógica correcta es reutilizar contenido por día y signo, no generar contenido nuevo para cada usuaria. Esto mantiene la personalización suficiente sin convertir el costo de IA en un problema operativo.

## Monetización

La monetización debe construirse con el menor impacto posible en la experiencia de calma. Google AdMob soporta distintos formatos de anuncios, incluidos banners y rewarded ads.[cite:42]

Estrategia sugerida:

- Banner discreto en historial, ajustes o pantallas secundarias.
- Rewarded ad opcional para una lectura ampliada del día.[cite:31][cite:32]
- Compra única para quitar anuncios.
- Evitar interstitials agresivos en el flujo principal, porque podrían romper la atmósfera serena de la app.

Además, la guía de inicio de AdMob indica que una app debe completar procesos como setup de cuenta, datos de pago, revisión de preparación y verificación de `app-ads.txt` para monetización completa.[cite:3]

## Privacidad y cumplimiento

Aunque Lumma no tenga cuentas registradas, igual necesita tratar privacidad con cuidado. OWASP destaca la importancia de proteger datos sensibles en almacenamiento local y revisar cómo esos datos pueden exponerse por backups, logs u otros mecanismos inseguros.[cite:153]

Puntos mínimos:

- Política de privacidad clara.
- Explicación en onboarding sobre qué se guarda localmente.
- Opción para borrar datos desde ajustes.
- Consentimiento de anuncios cuando aplique por región.

Google también ofrece herramientas para ayudar al cumplimiento con GDPR y otros requisitos de consentimiento publicitario dentro del ecosistema AdMob.[cite:162][cite:152]

## Roadmap técnico sugerido

### Fase 1: MVP
- App móvil con onboarding local.
- Perfil sin cuenta.
- Registro de ánimo.
- Frase diaria.
- Astrología por signo.
- Firmamento personal anual.
- Notificaciones locales.
- AdMob básico.

### Fase 2: Optimización
- Sistema de contenido remoto liviano.
- Ajuste de copy y notificaciones.
- Compra para quitar anuncios.
- Analytics mínimos.

### Fase 3: Escalado selectivo
- Backend en Render si la app necesita sincronización o actualización dinámica.
- Uso más refinado de Claude para lotes y variaciones.
- Eventual cuenta opcional solo si la restauración entre dispositivos realmente lo justifica.

## Recomendación final

La mejor decisión técnica para Lumma es empezar con una arquitectura simple, local y altamente controlada. El producto no necesita una plataforma compleja para validar si las personas regresan cada día por astrología, calma y su firmamento personal.[cite:117][cite:120]

Entre las herramientas ya disponibles, Claude es la más útil en el arranque si se usa para generación por lotes. Render puede entrar después como apoyo operativo. Resend, Paddle y Clerk no deberían formar parte del MVP porque aumentarían costo y complejidad sin mejorar la propuesta central de la app.
