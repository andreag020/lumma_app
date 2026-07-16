import { getDb } from '../core/db/database';
import {
  themeConfigFromRow,
  themeConfigToRow,
  defaultThemeConfig,
  type ThemeConfig,
  type ThemeConfigRow,
} from '../models';

export async function getThemeConfig(): Promise<ThemeConfig> {
  const db = await getDb();
  const row = await db.getFirstAsync<ThemeConfigRow>(
    'SELECT * FROM theme_config WHERE id = 1'
  );
  return row ? themeConfigFromRow(row) : defaultThemeConfig;
}

export async function saveThemeConfig(config: ThemeConfig): Promise<void> {
  const db = await getDb();
  const r = themeConfigToRow(config);
  await db.runAsync(
    `INSERT INTO theme_config (id, selected_theme_id, unlocked)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       selected_theme_id = excluded.selected_theme_id,
       unlocked = excluded.unlocked`,
    [r.selected_theme_id, r.unlocked]
  );
}
