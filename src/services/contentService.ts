import * as SecureStore from 'expo-secure-store';
import {
  bulkInsertContent,
  getContent,
  getContentForSign,
} from '../repositories/contentRepository';
import type { DailyContent, Language, ZodiacSign } from '../models';
import { DEFAULT_LANGUAGE } from '../models';
import { todayISODate } from '../core/utils/date';
// Contenido empaquetado como asset (generado offline por lotes con Claude
// Haiku 4.5; ver scripts/generate-content.mjs). Respaldo para el primer
// arranque sin red — nunca llama a la API en runtime.
import bundledContent from '../../assets/content/content.json';

// El asset embebido puede venir de una generación previa a la distribución
// multi-idioma (sin campo `language`): se asume español, que es el único
// idioma en el que se generó contenido hasta ahora.
const CONTENT = (bundledContent as Array<Partial<DailyContent>>).map(
  (item) => ({ language: DEFAULT_LANGUAGE, ...item })
) as DailyContent[];

/** Siembra el contenido empaquetado en SQLite. `bulkInsertContent` hace
 * INSERT OR REPLACE por `content_id`, así que llamarlo en cada arranque es
 * barato (12 filas) y además re-sincroniza el contenido si el asset vino
 * actualizado en una nueva versión de la app — antes se saltaba esto en
 * cuanto la base ya tenía suficientes filas, así que un dispositivo con
 * datos viejos nunca recibía el contenido nuevo empaquetado. */
export async function seedContent(): Promise<void> {
  await bulkInsertContent(CONTENT);
}

// El script offline (scripts/generate-content.mjs) corre cada lunes vía
// GitHub Action y publica el content.json actualizado en GitHub Pages —
// el repo puede seguir siendo privado porque solo se publica ese archivo,
// nunca el código. La app lo descarga aquí para no depender de una nueva
// versión en Play Store cada vez que hay lecturas nuevas.
const REMOTE_CONTENT_URL =
  'https://andreag020.github.io/lumma_app/content.json';
const LAST_SYNC_KEY = 'content_last_sync_date';
const FETCH_TIMEOUT_MS = 5000;

/**
 * Descarga el content.json publicado y lo fusiona en SQLite (INSERT OR
 * REPLACE, así que no duplica ni pisa nada más). Como mucho una vez al
 * día; si no hay red o el host no responde, falla en silencio y la app
 * sigue con el contenido que ya tenía (embebido o de una sincronización
 * previa). Nunca bloquea el arranque de la app.
 */
export async function refreshRemoteContent(): Promise<void> {
  try {
    const today = todayISODate();
    const lastSync = await SecureStore.getItemAsync(LAST_SYNC_KEY);
    if (lastSync === today) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(REMOTE_CONTENT_URL, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return;

    const remote = (await response.json()) as DailyContent[];
    if (!Array.isArray(remote) || remote.length === 0) return;

    await bulkInsertContent(remote);
    await SecureStore.setItemAsync(LAST_SYNC_KEY, today);
  } catch {
    // Sin red, host caído, o JSON inválido: seguimos con lo que ya había.
  }
}

/**
 * Devuelve el contenido del día para un signo e idioma.
 * 1) Coincidencia exacta de fecha (en el idioma pedido).
 * 2) Respaldo: la fecha disponible más cercana a hoy (nunca una fecha
 *    vieja al azar), para que siempre haya algo que mostrar aunque el
 *    contenido empaquetado/sincronizado no cubra exactamente hoy.
 * 3) Si el idioma pedido aún no tiene contenido generado (p. ej. inglés
 *    recién habilitado, a la espera del próximo lote semanal), se cae de
 *    vuelta al español antes que mostrar la pantalla vacía.
 */
export async function getDailyContent(
  date: string,
  sign: ZodiacSign,
  language: Language
): Promise<DailyContent | null> {
  const exact = await getContent(date, sign, language);
  if (exact) return exact;

  const forSign = await getContentForSign(sign, language);
  if (forSign.length > 0) {
    return closestByDate(forSign, date);
  }

  if (language !== DEFAULT_LANGUAGE) {
    return getDailyContent(date, sign, DEFAULT_LANGUAGE);
  }
  return null;
}

function closestByDate(items: DailyContent[], date: string): DailyContent {
  const target = new Date(date).getTime();
  return items.reduce((closest, item) =>
    Math.abs(new Date(item.date).getTime() - target) <
    Math.abs(new Date(closest.date).getTime() - target)
      ? item
      : closest
  );
}
