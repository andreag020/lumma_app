/** Paleta de moods fija para el MVP (personalizable en fase 2).
 * Colores pensados para verse como puntos de luz sobre el fondo noche,
 * elegidos dentro de la familia cromática asociada a cada emoción
 * (amarillo → alegría, azul → calma/melancolía, rojo → frustración, etc). */
export interface MoodOption {
  label: string;
  color: string;
}

export const MOOD_PALETTE: MoodOption[] = [
  { label: 'Calma', color: '#8FC1E3' },
  { label: 'Alegría', color: '#F2C94C' },
  { label: 'Gratitud', color: '#9BCB7A' },
  { label: 'Ternura', color: '#F2B6C9' },
  { label: 'Inspiración', color: '#B79EE8' },
  { label: 'Cansancio', color: '#8892B0' },
  { label: 'Melancolía', color: '#5B6E96' },
  { label: 'Inquietud', color: '#E0954F' },
  { label: 'Entusiasmo', color: '#F2665C' },
  { label: 'Curiosidad', color: '#5FC6D9' },
  { label: 'Nostalgia', color: '#A87CA0' },
  { label: 'Frustración', color: '#C0483E' },
];

export function moodOptionByColor(color: string): MoodOption | undefined {
  return MOOD_PALETTE.find((m) => m.color === color);
}
