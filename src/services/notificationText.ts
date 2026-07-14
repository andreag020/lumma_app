/**
 * Lógica pura del recordatorio de la frase diaria: sin `expo-notifications`
 * importado aquí, así que es testeable sin runtime nativo (a diferencia de
 * notificationService.ts, que sí lo necesita).
 *
 * Este recordatorio invita a leer la frase/guía del día — NO a registrar
 * el ánimo. Un recordatorio de ánimo aparte, configurable desde Ajustes,
 * es una función futura (ver tasks/todo.md T11) y no debe compartir estos
 * mensajes ni este canal.
 */

// Mensajes genéricos y calmados: una notificación programada no puede
// "saber" qué frase de astrología corresponderá a una fecha futura sin un
// backend, así que usamos invitaciones atemporales a leer la frase del
// día — coherente con la arquitectura local-first
// (consideraciones-tecnicas...md → Notificaciones).
export const PHRASE_REMINDER_MESSAGES = [
  'Tu frase de hoy ya está en el cielo, esperándote.',
  'Un momento para leer tu guía de esta noche.',
  'Lumma tiene una frase para ti esta noche.',
  'Tu cielo trae un mensaje para hoy.',
  'Una pausa, una frase, un poco de calma.',
];

/** "HH:mm" → [hour, minute]. */
export function parseTime(time: string): [number, number] {
  const [hour, minute] = time.split(':').map(Number);
  return [hour, minute];
}

/** Elige un mensaje de forma determinista a partir de un texto semilla,
 * para que no cambie en cada reprogramación del mismo horario. */
export function pickPhraseReminderMessage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PHRASE_REMINDER_MESSAGES[hash % PHRASE_REMINDER_MESSAGES.length];
}
