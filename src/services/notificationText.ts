/**
 * Lógica pura del recordatorio de la frase diaria: sin `expo-notifications`
 * importado aquí, así que es testeable sin runtime nativo (a diferencia de
 * notificationService.ts, que sí lo necesita).
 *
 * Estilo "horóscopo de periódico": cada notificación es la lectura real
 * del signo para ESE día (no un texto genérico) — por eso se programa una
 * notificación por fecha en vez de una sola repetitiva. Ver
 * notificationService.ts para la ventana móvil de días programados.
 *
 * Este recordatorio es sobre la frase diaria, no sobre el ánimo — un
 * recordatorio de ánimo aparte, configurable desde Ajustes, es una
 * función futura (ver tasks/todo.md T11) y no debe compartir este canal.
 */
import { ZODIAC_LABELS, type ZodiacSign, type DailyContent } from '../models';

/** "HH:mm" → [hour, minute]. */
export function parseTime(time: string): [number, number] {
  const [hour, minute] = time.split(':').map(Number);
  return [hour, minute];
}

/**
 * Título y cuerpo de la notificación para un día concreto, al estilo de
 * una columna de horóscopo de periódico: el signo como encabezado y la
 * lectura del día como cuerpo.
 */
export function buildPhraseNotificationContent(
  sign: ZodiacSign,
  content: DailyContent
): { title: string; body: string } {
  return {
    title: `${ZODIAC_LABELS[sign]} · tu lectura de hoy`,
    body: content.shortAstrologyText,
  };
}
