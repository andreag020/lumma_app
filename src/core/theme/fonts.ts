/**
 * Tipografía de marca: una serif itálica (Cormorant Garamond) para
 * títulos y frases — evoca cartas astrológicas y ediciones antiguas,
 * coherente con el tono místico y sereno de Lumma. Se usa con
 * moderación: solo en encabezados y citas, nunca en botones, formularios
 * ni texto largo, donde la fuente del sistema sigue siendo más legible.
 */
import {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';

/** Pasar a `useFonts()` en la raíz de la app. */
export const fontAssets = {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_400Regular_Italic,
};

export const fonts = {
  /** Títulos de pantalla, marca. */
  heading: 'CormorantGaramond_500Medium_Italic',
  /** Frases, citas — un peso más ligero para sentirse susurrado. */
  quote: 'CormorantGaramond_400Regular_Italic',
} as const;
