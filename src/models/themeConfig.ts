import type { ThemeId } from '../core/theme/theme';
import { DEFAULT_THEME_ID } from '../core/theme/theme';

/** Selección de tema visual y estado de desbloqueo (compra única que
 * también quita los anuncios — ver AdsConfig). */
export interface ThemeConfig {
  selectedThemeId: ThemeId;
  unlocked: boolean;
}

export interface ThemeConfigRow {
  id: number; // fila única (id = 1)
  selected_theme_id: string;
  unlocked: number; // 0 | 1
}

export function themeConfigToRow(c: ThemeConfig): ThemeConfigRow {
  return {
    id: 1,
    selected_theme_id: c.selectedThemeId,
    unlocked: c.unlocked ? 1 : 0,
  };
}

export function themeConfigFromRow(r: ThemeConfigRow): ThemeConfig {
  return {
    selectedThemeId: r.selected_theme_id as ThemeId,
    unlocked: r.unlocked === 1,
  };
}

export const defaultThemeConfig: ThemeConfig = {
  selectedThemeId: DEFAULT_THEME_ID,
  unlocked: false,
};
