import {
  bulkInsertContent,
  countContent,
  getContent,
  getContentForSign,
} from '../repositories/contentRepository';
import type { DailyContent, ZodiacSign } from '../models';
import { dayOfYear } from '../core/utils/date';
// Contenido empaquetado como asset (generado offline por lotes con Claude
// Haiku 4.5; ver scripts/generate-content.mjs). Nunca llama a la API en runtime.
import bundledContent from '../../assets/content/content.json';

const CONTENT = bundledContent as DailyContent[];

/** Siembra el contenido empaquetado en SQLite si aún no está cargado.
 * Idempotente: se puede llamar en cada arranque. */
export async function seedContent(): Promise<void> {
  const existing = await countContent();
  if (existing >= CONTENT.length) return;
  await bulkInsertContent(CONTENT);
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
