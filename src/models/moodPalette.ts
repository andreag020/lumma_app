import type { Language } from './language';

/** Paleta de moods fija para el MVP (personalizable en fase 2).
 * Colores pensados para verse como puntos de luz sobre el fondo noche.
 * `key` es estable entre idiomas; `labels` trae el texto visible de cada uno. */
export interface MoodOption {
  key: string;
  color: string;
  labels: Record<Language, string>;
}

export const MOOD_PALETTE: MoodOption[] = [
  { key: 'calm', color: '#C7B6F2', labels: { es: 'Calma', en: 'Calm' } },
  { key: 'joy', color: '#E5C46B', labels: { es: 'Alegría', en: 'Joy' } },
  { key: 'gratitude', color: '#B6D77A', labels: { es: 'Gratitud', en: 'Gratitude' } },
  { key: 'tenderness', color: '#F2B6C9', labels: { es: 'Ternura', en: 'Tenderness' } },
  { key: 'inspiration', color: '#7FD1C4', labels: { es: 'Inspiración', en: 'Inspiration' } },
  { key: 'tiredness', color: '#8892B0', labels: { es: 'Cansancio', en: 'Tiredness' } },
  { key: 'melancholy', color: '#5B6491', labels: { es: 'Melancolía', en: 'Melancholy' } },
  { key: 'restlessness', color: '#D97757', labels: { es: 'Inquietud', en: 'Restlessness' } },
  { key: 'enthusiasm', color: '#E2645A', labels: { es: 'Entusiasmo', en: 'Enthusiasm' } },
  { key: 'curiosity', color: '#6FB8D9', labels: { es: 'Curiosidad', en: 'Curiosity' } },
  { key: 'nostalgia', color: '#A87CA0', labels: { es: 'Nostalgia', en: 'Nostalgia' } },
  { key: 'frustration', color: '#A85D45', labels: { es: 'Frustración', en: 'Frustration' } },
];

export function moodOptionByColor(color: string): MoodOption | undefined {
  return MOOD_PALETTE.find((m) => m.color === color);
}

export function moodLabel(option: MoodOption, language: Language): string {
  return option.labels[language];
}
