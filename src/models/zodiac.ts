/** Signos zodiacales. El onboarding pide selección manual para reducir
 * la sensibilidad de los datos (ver consideraciones-tecnicas...md). */
export const ZODIAC_SIGNS = [
  'aries',
  'tauro',
  'geminis',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'escorpio',
  'sagitario',
  'capricornio',
  'acuario',
  'piscis',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}

/** Nombre visible en español (con acentos) para cada signo. */
export const ZODIAC_LABELS: Record<ZodiacSign, string> = {
  aries: 'Aries',
  tauro: 'Tauro',
  geminis: 'Géminis',
  cancer: 'Cáncer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  escorpio: 'Escorpio',
  sagitario: 'Sagitario',
  capricornio: 'Capricornio',
  acuario: 'Acuario',
  piscis: 'Piscis',
};

/** Glifo astrológico (Unicode, sin dependencias de íconos) por signo. */
export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  aries: '♈',
  tauro: '♉',
  geminis: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  escorpio: '♏',
  sagitario: '♐',
  capricornio: '♑',
  acuario: '♒',
  piscis: '♓',
};
