/**
 * Tema Lumma — dirección visual de marca.
 * Base nocturna profunda con acentos de luz reservados para los puntos
 * clave de interacción y emoción. La app soporta varios temas visuales
 * (fondo/superficies/acentos/tipografía) — `moodPalette.ts` (los 12
 * colores de emoción) nunca cambia entre ellos.
 *
 * Los nombres de campo (`gold`, `ivory`, `lime`, `lavender`) son roles
 * heredados del tema original (acento principal, texto, acento
 * secundario, acento terciario) — en los temas nuevos no describen el
 * matiz literal, solo el rol que cumplía ese color en el tema base.
 *
 * Fuente: concepto-de-marca.md → "Dirección visual".
 */

export type ThemeId = 'indigo' | 'forest' | 'plum' | 'frost';

/** Forma de las partículas flotantes del fondo (`AmbientSky`) — 'star' es
 * el punto/halo original, los demás son la seña visual propia de cada
 * tema de pago. Nunca afecta `moodPalette.ts`. */
export type ParticleStyle = 'star' | 'firefly' | 'petal' | 'snowflake';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  petrol: string;
  gold: string;
  ivory: string;
  lime: string;
  lavender: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  constellationLine: string;
  border: string;
}

/** Nombres de fuente ya cargados vía `useFonts()` (ver fonts.ts) — deben
 * coincidir exactamente con las claves de `fontAssets`. */
export interface ThemeFonts {
  heading: string;
  quote: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tag: string;
  /** true solo para el tema incluido por defecto (sin desbloqueo). */
  free: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  particleStyle: ParticleStyle;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  indigo: {
    id: 'indigo',
    name: 'Índigo Nocturno',
    tag: 'Incluido',
    free: true,
    colors: {
      background: '#0E0B1A',
      surface: '#171334',
      surfaceMuted: '#221C42',
      petrol: '#123433',
      gold: '#E5C46B',
      ivory: '#F4EFE3',
      lime: '#B6D77A',
      lavender: '#C7B6F2',
      textPrimary: '#F4EFE3',
      textSecondary: '#B7B0CE',
      textMuted: '#7C7699',
      constellationLine: 'rgba(199, 182, 242, 0.35)',
      border: 'rgba(244, 239, 227, 0.10)',
    },
    fonts: {
      heading: 'CormorantGaramond_500Medium_Italic',
      quote: 'CormorantGaramond_400Regular_Italic',
    },
    particleStyle: 'star',
  },
  forest: {
    id: 'forest',
    name: 'Bosque de Luciérnagas',
    tag: 'De pago',
    free: false,
    colors: {
      background: '#0A1613',
      surface: '#13241F',
      surfaceMuted: '#1C332B',
      petrol: '#0F2E3A',
      gold: '#E8B95B',
      ivory: '#F1ECDD',
      lime: '#A9CE7B',
      lavender: '#7FBFAE',
      textPrimary: '#F1ECDD',
      textSecondary: '#AEC2B6',
      textMuted: '#728075',
      constellationLine: 'rgba(127, 191, 174, 0.35)',
      border: 'rgba(241, 236, 221, 0.10)',
    },
    fonts: {
      heading: 'Fraunces_600SemiBold_Italic',
      quote: 'Fraunces_400Regular_Italic',
    },
    particleStyle: 'firefly',
  },
  plum: {
    id: 'plum',
    name: 'Aurora de Ciruela',
    tag: 'De pago',
    free: false,
    colors: {
      background: '#170B18',
      surface: '#241531',
      surfaceMuted: '#331D42',
      petrol: '#201A45',
      gold: '#E8AE7C',
      ivory: '#F5EAE8',
      lime: '#E8A0B8',
      lavender: '#C79AE8',
      textPrimary: '#F5EAE8',
      textSecondary: '#C9AFC7',
      textMuted: '#8C748B',
      constellationLine: 'rgba(199, 154, 232, 0.35)',
      border: 'rgba(245, 234, 232, 0.10)',
    },
    fonts: {
      heading: 'Italiana_400Regular',
      quote: 'Italiana_400Regular',
    },
    particleStyle: 'petal',
  },
  frost: {
    id: 'frost',
    name: 'Escarcha Boreal',
    tag: 'De pago',
    free: false,
    colors: {
      background: '#070C1A',
      surface: '#101A33',
      surfaceMuted: '#182544',
      petrol: '#14304F',
      gold: '#6FCBE0',
      ivory: '#EDF1F7',
      lime: '#7FE0C4',
      lavender: '#9FB3F2',
      textPrimary: '#EDF1F7',
      textSecondary: '#A9B4D1',
      textMuted: '#6B7593',
      constellationLine: 'rgba(159, 179, 242, 0.35)',
      border: 'rgba(237, 241, 247, 0.10)',
    },
    fonts: {
      heading: 'BodoniModa_600SemiBold',
      quote: 'BodoniModa_500Medium_Italic',
    },
    particleStyle: 'snowflake',
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'indigo';

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

export type SpacingTokens = typeof spacing;
export type RadiusTokens = typeof radius;

/** Encabezados: serif itálica de marca (ver fonts.ts) — solo títulos y
 * citas. El resto de la interfaz usa la fuente del sistema. */
export function makeTypography(fonts: ThemeFonts) {
  return {
    display: { fontFamily: fonts.heading, fontSize: 38, letterSpacing: 0.3 },
    title: { fontFamily: fonts.heading, fontSize: 28, letterSpacing: 0.2 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: '400' as const },
  } as const;
}

export type Typography = ReturnType<typeof makeTypography>;
