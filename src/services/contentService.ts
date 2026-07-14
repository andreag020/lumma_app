import * as SecureStore from 'expo-secure-store';
import {
  bulkInsertContent,
  countContent,
  getContent,
  getContentForSign,
} from '../repositories/contentRepository';
import type { DailyContent, ZodiacSign } from '../models';
import { dayOfYear, todayISODate } from '../core/utils/date';
// Contenido empaquetado como asset (generado offline por lotes con Claude
// Haiku 4.5; ver scripts/generate-content.mjs). Respaldo para el primer
// arranque sin red — nunca llama a la API en runtime.
import bundledContent from '../../assets/content/content.json';

const CONTENT = bundledContent as DailyContent[];

/** Siembra el contenido empaquetado en SQLite si aún no está cargado.
 * Idempotente: se puede llamar en cada arranque. */
export async function seedContent(): Promise<void> {
  const existing = await countContent();
  if (existing >= CONTENT.length) return;
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
 * Devuelve el contenido del día para un signo.
 * 1) Coincidencia exacta de fecha.
 * 2) Respaldo determinista: rota entre el contenido disponible del signo
 *    según el día del año, para que siempre haya algo que mostrar aunque
 *    el contenido empaquetado no cubra la fecha de hoy.
 */
export async function getDailyContent(
  date: string,
  sign: ZodiacSign
): Promise<DailyContent | null> {
  const exact = await getContent(date, sign);
  if (exact) return exact;

  const forSign = await getContentForSign(sign);
  if (forSign.length === 0) return null;

  const index = dayOfYear(date) % forSign.length;
  return forSign[index];
}
