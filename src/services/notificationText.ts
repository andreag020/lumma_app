/**
 * Lógica pura del recordatorio diario: sin `expo-notifications` importado
 * aquí, así que es testeable sin runtime nativo (a diferencia de
 * notificationService.ts, que sí lo necesita).
 */

// Mensajes genéricos y calmados: una notificación programada no puede
// "saber" qué frase de astrología corresponderá a una fecha futura sin un
// backend, así que usamos invitaciones atemporales — coherente con la
// arquitectura local-first (consideraciones-tecnicas...md → Notificaciones).
export const REMINDER_MESSAGES = [
  'Tu cielo te espera esta noche.',
  'Un momento para ti: mira arriba y respira.',
  'Es hora de tu ritual. Tu firmamento te extraña.',
  '¿Cómo estuvo tu día? Déjale una luz a tu firmamento.',
  'La noche invita a la calma. Lumma te acompaña.',
];

/** "HH:mm" → [hour, minute]. */
export function parseTime(time: string): [number, number] {
  const [hour, minute] = time.split(':').map(Number);
  return [hour, minute];
}

/** Elige un mensaje de forma determinista a partir de un texto semilla,
 * para que no cambie en cada reprogramación del mismo horario. */
export function pickReminderMessage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return REMINDER_MESSAGES[hash % REMINDER_MESSAGES.length];
}
