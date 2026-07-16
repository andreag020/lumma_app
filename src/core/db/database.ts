import * as SQLite from 'expo-sqlite';

const DB_NAME = 'lumma.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Devuelve la conexión SQLite abierta (singleton), aplicando migraciones. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

/** Migraciones idempotentes basadas en user_version. */
export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        user_id_local       TEXT PRIMARY KEY NOT NULL,
        nickname            TEXT,
        zodiac_sign         TEXT NOT NULL,
        birth_date_optional TEXT,
        notification_time   TEXT NOT NULL,
        language            TEXT NOT NULL,
        enabled_modules     TEXT NOT NULL,
        theme_preferences   TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_entry (
        entry_id             TEXT PRIMARY KEY NOT NULL,
        date                 TEXT NOT NULL UNIQUE,
        mood_color           TEXT NOT NULL,
        mood_label           TEXT NOT NULL,
        note_optional        TEXT,
        daily_phrase_id      TEXT,
        astrology_message_id TEXT
      );

      CREATE TABLE IF NOT EXISTS daily_content (
        content_id             TEXT PRIMARY KEY NOT NULL,
        date                   TEXT NOT NULL,
        zodiac_sign            TEXT NOT NULL,
        short_astrology_text   TEXT NOT NULL,
        daily_phrase           TEXT NOT NULL,
        extended_text_optional TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_daily_content_date_sign
        ON daily_content (date, zodiac_sign);

      CREATE TABLE IF NOT EXISTS ads_config (
        id                 INTEGER PRIMARY KEY CHECK (id = 1),
        ads_removed        INTEGER NOT NULL DEFAULT 0,
        consent_status     TEXT NOT NULL DEFAULT 'unknown',
        last_consent_check TEXT
      );

      PRAGMA user_version = 1;
    `);
  }

  if (currentVersion < 2) {
    // Recordatorio de ánimo (T11): independiente del de la frase diaria,
    // apagado por defecto para perfiles ya existentes.
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN mood_reminder_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE profile ADD COLUMN mood_reminder_time TEXT;

      PRAGMA user_version = 2;
    `);
  }

  if (currentVersion < 3) {
    // Selección de tema visual + desbloqueo (compra única que también
    // quita los anuncios, ver ads_config). 'indigo' es el tema incluido.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS theme_config (
        id                 INTEGER PRIMARY KEY CHECK (id = 1),
        selected_theme_id  TEXT NOT NULL DEFAULT 'indigo',
        unlocked           INTEGER NOT NULL DEFAULT 0
      );

      PRAGMA user_version = 3;
    `);
  }
}

/** Borra todos los datos de la usuaria (ajustes → "borrar mis datos"). */
export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM profile;
    DELETE FROM daily_entry;
    DELETE FROM ads_config;
    DELETE FROM theme_config;
  `);
}

/** Solo para pruebas: reinicia el singleton. */
export function __resetDbForTests(): void {
  dbPromise = null;
}
