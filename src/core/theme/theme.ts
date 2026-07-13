/**
 * Tema Lumma — dirección visual de marca.
 * Base nocturna profunda (índigo / ciruela) con acentos de luz reservados
 * para los puntos clave de interacción y emoción.
 *
 * Fuente: concepto-de-marca.md → "Dirección visual".
 */

export const colors = {
  // Fondos: noche profunda
  background: '#0E0B1A', // índigo/ciruela muy oscuro
  surface: '#171334', // superficie elevada (tarjetas)
  surfaceMuted: '#221C42',
  petrol: '#123433', // verde petróleo: naturaleza / campo nocturno

  // Acentos de luz (usar con moderación)
  gold: '#E5C46B', // dorado suave — acción principal, brillo del día
  ivory: '#F4EFE3', // marfil — texto principal sobre fondo noche
  lime: '#B6D77A', // verde-lima tenue
  lavender: '#C7B6F2', // lavanda luminosa

  // Texto
  textPrimary: '#F4EFE3',
  textSecondary: '#B7B0CE',
  textMuted: '#7C7699',

  // Líneas de constelación (finas, discretas)
  constellationLine: 'rgba(199, 182, 242, 0.35)',

  // Estados
  border: 'rgba(244, 239, 227, 0.10)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '300' as const, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '400' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export const theme = { colors, spacing, radius, typography } as const;
export type Theme = typeof theme;
