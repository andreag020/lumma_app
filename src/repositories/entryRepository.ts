import { getDb } from '../core/db/database';
import {
  dailyEntryFromRow,
  dailyEntryToRow,
  type DailyEntry,
  type DailyEntryRow,
} from '../models';

/** Inserta o actualiza el registro del día (un registro por fecha). */
export async function upsertEntry(entry: DailyEntry): Promise<void> {
  const db = await getDb();
  const r = dailyEntryToRow(entry);
  await db.runAsync(
    `INSERT INTO daily_entry
       (entry_id, date, mood_color, mood_label, note_optional,
        daily_phrase_id, astrology_message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       mood_color = excluded.mood_color,
       mood_label = excluded.mood_label,
       note_optional = excluded.note_optional,
       daily_phrase_id = excluded.daily_phrase_id,
       astrology_message_id = excluded.astrology_message_id`,
    [
      r.entry_id,
      r.date,
      r.mood_color,
      r.mood_label,
      r.note_optional,
      r.daily_phrase_id,
      r.astrology_message_id,
    ]
  );
}

export async function getEntryByDate(date: string): Promise<DailyEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DailyEntryRow>(
    'SELECT * FROM daily_entry WHERE date = ?',
    [date]
  );
  return row ? dailyEntryFromRow(row) : null;
}

/** Registros en un rango de fechas (para pintar el firmamento anual). */
export async function getEntriesInRange(
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DailyEntryRow>(
    'SELECT * FROM daily_entry WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
  return rows.map(dailyEntryFromRow);
}
