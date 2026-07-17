import type { Language } from './language';

/** Paleta de moods fija para el MVP (personalizable en fase 2).
 * Colores pensados para verse como puntos de luz sobre el fondo noche,
 * elegidos dentro de la familia cromática asociada a cada emoción
 * (amarillo → alegría, azul → calma/melancolía, rojo → frustración, etc).
 * `key` es estable entre idiomas; `labels` trae el texto visible de cada uno. */
export interface MoodOption {
  key: string;
  color: string;
  labels: Record<Language, string>;
}

export const MOOD_PALETTE: MoodOption[] = [
  { key: 'calm', color: '#8FC1E3', labels: { es: 'Calma', en: 'Calm' } },
  { key: 'joy', color: '#F2C94C', labels: { es: 'Alegría', en: 'Joy' } },
  { key: 'gratitude', color: '#9BCB7A', labels: { es: 'Gratitud', en: 'Gratitude' } },
  { key: 'tenderness', color: '#F2B6C9', labels: { es: 'Ternura', en: 'Tenderness' } },
  { key: 'inspiration', color: '#B79EE8', labels: { es: 'Inspiración', en: 'Inspiration' } },
  { key: 'tiredness', color: '#8892B0', labels: { es: 'Cansancio', en: 'Tiredness' } },
  { key: 'melancholy', color: '#5B6E96', labels: { es: 'Melancolía', en: 'Melancholy' } },
  { key: 'restlessness', color: '#E0954F', labels: { es: 'Inquietud', en: 'Restlessness' } },
  { key: 'enthusiasm', color: '#F2665C', labels: { es: 'Entusiasmo', en: 'Enthusiasm' } },
  { key: 'curiosity', color: '#5FC6D9', labels: { es: 'Curiosidad', en: 'Curiosity' } },
  { key: 'nostalgia', color: '#A87CA0', labels: { es: 'Nostalgia', en: 'Nostalgia' } },
  { key: 'frustration', color: '#C0483E', labels: { es: 'Frustración', en: 'Frustration' } },
];

export function moodOptionByColor(color: string): MoodOption | undefined {
  return MOOD_PALETTE.find((m) => m.color === color);
}

export function moodLabel(option: MoodOption, language: Language): string {
  return option.labels[language];
}
