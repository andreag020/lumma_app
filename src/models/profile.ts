import type { ZodiacSign } from './zodiac';

/** Perfil local de la usuaria (sin cuenta). Vive solo en el dispositivo. */
export interface Profile {
  userIdLocal: string;
  nickname: string | null;
  zodiacSign: ZodiacSign;
  /** Solo si la usuaria decide darla; se guarda con cuidado (secure storage). */
  birthDate: string | null; // ISO date
  notificationTime: string; // "HH:mm"
  language: string; // p. ej. "es"
  enabledModules: string[]; // módulos activos
  themePreferences: Record<string, unknown>;
}

/** Fila tal como se almacena en SQLite (snake_case, valores serializados). */
export interface ProfileRow {
  user_id_local: string;
  nickname: string | null;
  zodiac_sign: string;
  birth_date_optional: string | null;
  notification_time: string;
  language: string;
  enabled_modules: string; // JSON
  theme_preferences: string; // JSON
}

export function profileToRow(p: Profile): ProfileRow {
  return {
    user_id_local: p.userIdLocal,
    nickname: p.nickname,
    zodiac_sign: p.zodiacSign,
    birth_date_optional: p.birthDate,
    notification_time: p.notificationTime,
    language: p.language,
    enabled_modules: JSON.stringify(p.enabledModules),
    theme_preferences: JSON.stringify(p.themePreferences),
  };
}

export function profileFromRow(r: ProfileRow): Profile {
  return {
    userIdLocal: r.user_id_local,
    nickname: r.nickname,
    zodiacSign: r.zodiac_sign as ZodiacSign,
    birthDate: r.birth_date_optional,
    notificationTime: r.notification_time,
    language: r.language,
    enabledModules: JSON.parse(r.enabled_modules) as string[],
    themePreferences: JSON.parse(r.theme_preferences) as Record<string, unknown>,
  };
}
