import { getDb } from '../core/db/database';
import {
  dailyContentFromRow,
  dailyContentToRow,
  type DailyContent,
  type DailyContentRow,
  type Language,
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
           (content_id, date, zodiac_sign, language, short_astrology_text,
            daily_phrase, extended_text_optional)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          r.content_id,
          r.date,
          r.zodiac_sign,
          r.language,
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
  sign: ZodiacSign,
  language: Language
): Promise<DailyContent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DailyContentRow>(
    'SELECT * FROM daily_content WHERE date = ? AND zodiac_sign = ? AND language = ? LIMIT 1',
    [date, sign, language]
  );
  return row ? dailyContentFromRow(row) : null;
}

/** Todo el contenido de un signo en un idioma (ordenado por fecha). Sirve
 * de respaldo cuando no hay una coincidencia exacta de fecha. */
export async function getContentForSign(
  sign: ZodiacSign,
  language: Language
): Promise<DailyContent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DailyContentRow>(
    'SELECT * FROM daily_content WHERE zodiac_sign = ? AND language = ? ORDER BY date ASC',
    [sign, language]
  );
  return rows.map(dailyContentFromRow);
}
