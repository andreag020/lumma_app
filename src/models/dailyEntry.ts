/** Registro emocional de un día: un punto de luz en el firmamento personal. */
export interface DailyEntry {
  entryId: string;
  date: string; // ISO date "YYYY-MM-DD" (un registro por día)
  moodColor: string; // hex, p. ej. "#E5C46B"
  moodLabel: string;
  note: string | null;
  dailyPhraseId: string | null;
  astrologyMessageId: string | null;
}

export interface DailyEntryRow {
  entry_id: string;
  date: string;
  mood_color: string;
  mood_label: string;
  note_optional: string | null;
  daily_phrase_id: string | null;
  astrology_message_id: string | null;
}

export function dailyEntryToRow(e: DailyEntry): DailyEntryRow {
  return {
    entry_id: e.entryId,
    date: e.date,
    mood_color: e.moodColor,
    mood_label: e.moodLabel,
    note_optional: e.note,
    daily_phrase_id: e.dailyPhraseId,
    astrology_message_id: e.astrologyMessageId,
  };
}

export function dailyEntryFromRow(r: DailyEntryRow): DailyEntry {
  return {
    entryId: r.entry_id,
    date: r.date,
    moodColor: r.mood_color,
    moodLabel: r.mood_label,
    note: r.note_optional,
    dailyPhraseId: r.daily_phrase_id,
    astrologyMessageId: r.astrology_message_id,
  };
}
