import { create } from 'zustand';
import { getThemeConfig, saveThemeConfig } from '../repositories/themeRepository';
import { getAdsConfig, saveAdsConfig } from '../repositories/adsRepository';
import { THEMES, DEFAULT_THEME_ID, type ThemeId } from '../core/theme/theme';

interface ThemeState {
  selectedThemeId: ThemeId;
  /** true tras el "paquete de apoyo" (quita anuncios + desbloquea temas). */
  unlocked: boolean;
  /** true una vez que se intentó cargar la config desde SQLite. */
  loaded: boolean;
  load: () => Promise<void>;
  /** Cambia el tema activo. Los temas de pago solo se pueden elegir si `unlocked`. */
  selectTheme: (id: ThemeId) => Promise<void>;
  /** Marcador de desarrollo: simula la compra hasta que Play Billing esté
   * conectado de verdad. También quita los anuncios (mismo paquete). */
  devUnlock: () => Promise<void>;
  /** Vuelve a bloquear los temas de pago (solo para probar el flujo). */
  devLock: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  selectedThemeId: DEFAULT_THEME_ID,
  unlocked: false,
  loaded: false,

  load: async () => {
    const config = await getThemeConfig();
    set({
      selectedThemeId: config.selectedThemeId,
      unlocked: config.unlocked,
      loaded: true,
    });
  },

  selectTheme: async (id: ThemeId) => {
    const { unlocked } = get();
    if (!THEMES[id].free && !unlocked) return;
    await saveThemeConfig({ selectedThemeId: id, unlocked });
    set({ selectedThemeId: id });
  },

  devUnlock: async () => {
    const { selectedThemeId } = get();
    await saveThemeConfig({ selectedThemeId, unlocked: true });
    const ads = await getAdsConfig();
    await saveAdsConfig({ ...ads, adsRemoved: true });
    set({ unlocked: true });
  },

  devLock: async () => {
    const { selectedThemeId } = get();
    const nextTheme = THEMES[selectedThemeId].free ? selectedThemeId : DEFAULT_THEME_ID;
    await saveThemeConfig({ selectedThemeId: nextTheme, unlocked: false });
    const ads = await getAdsConfig();
    await saveAdsConfig({ ...ads, adsRemoved: false });
    set({ unlocked: false, selectedThemeId: nextTheme });
  },
}));
