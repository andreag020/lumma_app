import type { ZodiacSign } from './zodiac';
import type { Language } from './language';

/** Contenido diario por signo, fecha e idioma. Se reutiliza entre usuarias
 * (no se genera por persona en runtime). Empaquetado como assets. */
export interface DailyContent {
  contentId: string;
  date: string; // ISO date "YYYY-MM-DD"
  zodiacSign: ZodiacSign;
  language: Language;
  shortAstrologyText: string;
  dailyPhrase: string;
  extendedText: string | null;
}

export interface DailyContentRow {
  content_id: string;
  date: string;
  zodiac_sign: string;
  language: string;
  short_astrology_text: string;
  daily_phrase: string;
  extended_text_optional: string | null;
}

export function dailyContentToRow(c: DailyContent): DailyContentRow {
  return {
    content_id: c.contentId,
    date: c.date,
    zodiac_sign: c.zodiacSign,
    language: c.language,
    short_astrology_text: c.shortAstrologyText,
    daily_phrase: c.dailyPhrase,
    extended_text_optional: c.extendedText,
  };
}

export function dailyContentFromRow(r: DailyContentRow): DailyContent {
  return {
    contentId: r.content_id,
    date: r.date,
    zodiacSign: r.zodiac_sign as ZodiacSign,
    language: r.language as Language,
    shortAstrologyText: r.short_astrology_text,
    dailyPhrase: r.daily_phrase,
    extendedText: r.extended_text_optional,
  };
}
