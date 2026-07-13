import type { ZodiacSign } from './zodiac';

/** Contenido diario por signo y fecha. Se reutiliza entre usuarias
 * (no se genera por persona en runtime). Empaquetado como assets. */
export interface DailyContent {
  contentId: string;
  date: string; // ISO date "YYYY-MM-DD"
  zodiacSign: ZodiacSign;
  shortAstrologyText: string;
  dailyPhrase: string;
  extendedText: string | null;
}

export interface DailyContentRow {
  content_id: string;
  date: string;
  zodiac_sign: string;
  short_astrology_text: string;
  daily_phrase: string;
  extended_text_optional: string | null;
}

export function dailyContentToRow(c: DailyContent): DailyContentRow {
  return {
    content_id: c.contentId,
    date: c.date,
    zodiac_sign: c.zodiacSign,
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
    shortAstrologyText: r.short_astrology_text,
    dailyPhrase: r.daily_phrase,
    extendedText: r.extended_text_optional,
  };
}
