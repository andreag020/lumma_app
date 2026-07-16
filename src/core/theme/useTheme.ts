import { useMemo } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { THEMES, spacing, radius, makeTypography } from './theme';

/** Sustituto reactivo del antiguo `colors`/`typography` estáticos — se
 * recalcula cuando cambia el tema seleccionado (ver themeStore). */
export function useTheme() {
  const selectedThemeId = useThemeStore((s) => s.selectedThemeId);
  const theme = THEMES[selectedThemeId];
  const typography = useMemo(() => makeTypography(theme.fonts), [theme]);

  return {
    theme,
    colors: theme.colors,
    fonts: theme.fonts,
    spacing,
    radius,
    typography,
  };
}
