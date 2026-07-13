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
