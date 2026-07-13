import { getDb } from '../core/db/database';
import {
  dailyContentFromRow,
  dailyContentToRow,
  type DailyContent,
  type DailyContentRow,
  type ZodiacSign,
} from '../models';

/** Carga masiva del contenido empaquetado (assets) a la base local. */
export async function bulkInsertContent(items: DailyContent[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      const r = dailyContentToRow(item);
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_content
           (content_id, date, zodiac_sign, short_astrology_text,
            daily_phrase, extended_text_optional)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          r.content_id,
          r.date,
          r.zodiac_sign,
          r.short_astrology_text,
          r.daily_phrase,
          r.extended_text_optional,
        ]
      );
    }
  });
}

export async function getContent(
  date: string,
  sign: ZodiacSign
): Promise<DailyContent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DailyContentRow>(
    'SELECT * FROM daily_content WHERE date = ? AND zodiac_sign = ? LIMIT 1',
    [date, sign]
  );
  return row ? dailyContentFromRow(row) : null;
}

/** Todo el contenido de un signo (ordenado por fecha). Sirve de respaldo
 * cuando no hay una coincidencia exacta de fecha. */
export async function getContentForSign(
  sign: ZodiacSign
): Promise<DailyContent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DailyContentRow>(
    'SELECT * FROM daily_content WHERE zodiac_sign = ? ORDER BY date ASC',
    [sign]
  );
  return rows.map(dailyContentFromRow);
}

/** Número de filas de contenido cargadas (para decidir si sembrar). */
export async function countContent(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM daily_content'
  );
  return row?.n ?? 0;
}
