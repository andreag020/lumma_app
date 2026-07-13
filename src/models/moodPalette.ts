/** Paleta de moods fija para el MVP (personalizable en fase 2).
 * Colores pensados para verse como puntos de luz sobre el fondo noche. */
export interface MoodOption {
  label: string;
  color: string;
}

export const MOOD_PALETTE: MoodOption[] = [
  { label: 'Calma', color: '#C7B6F2' },
  { label: 'Alegría', color: '#E5C46B' },
  { label: 'Gratitud', color: '#B6D77A' },
  { label: 'Ternura', color: '#F2B6C9' },
  { label: 'Inspiración', color: '#7FD1C4' },
  { label: 'Cansancio', color: '#8892B0' },
  { label: 'Melancolía', color: '#5B6491' },
  { label: 'Inquietud', color: '#D97757' },
];

export function moodOptionByColor(color: string): MoodOption | undefined {
  return MOOD_PALETTE.find((m) => m.color === color);
}
