import { getDb } from '../core/db/database';
import {
  profileFromRow,
  profileToRow,
  type Profile,
  type ProfileRow,
} from '../models';

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  const r = profileToRow(profile);
  await db.runAsync(
    `INSERT INTO profile
       (user_id_local, nickname, zodiac_sign, birth_date_optional,
        notification_time, language, enabled_modules, theme_preferences)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id_local) DO UPDATE SET
       nickname = excluded.nickname,
       zodiac_sign = excluded.zodiac_sign,
       birth_date_optional = excluded.birth_date_optional,
       notification_time = excluded.notification_time,
       language = excluded.language,
       enabled_modules = excluded.enabled_modules,
       theme_preferences = excluded.theme_preferences`,
    [
      r.user_id_local,
      r.nickname,
      r.zodiac_sign,
      r.birth_date_optional,
      r.notification_time,
      r.language,
      r.enabled_modules,
      r.theme_preferences,
    ]
  );
}

/** Perfil local actual (la app maneja un único perfil sin cuenta). */
export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM profile LIMIT 1'
  );
  return row ? profileFromRow(row) : null;
}

export async function hasProfile(): Promise<boolean> {
  return (await getProfile()) !== null;
}
