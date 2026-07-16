/**
 * Tipografía de marca: una serif con carácter para títulos y frases —
 * evoca cartas astrológicas y ediciones antiguas. Se usa con moderación:
 * solo en encabezados y citas, nunca en botones, formularios ni texto
 * largo, donde la fuente del sistema sigue siendo más legible.
 *
 * Cada tema (ver theme.ts) trae su propio par encabezado/cita, así que
 * aquí se cargan todas las variantes usadas por los cuatro temas —
 * `useFonts()` en la raíz de la app las deja listas sin importar cuál
 * esté seleccionado.
 */
import {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Fraunces_600SemiBold_Italic,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import { Italiana_400Regular } from '@expo-google-fonts/italiana';
import {
  BodoniModa_600SemiBold,
  BodoniModa_500Medium_Italic,
} from '@expo-google-fonts/bodoni-moda';

/** Pasar a `useFonts()` en la raíz de la app. */
export const fontAssets = {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_400Regular_Italic,
  Fraunces_600SemiBold_Italic,
  Fraunces_400Regular_Italic,
  Italiana_400Regular,
  BodoniModa_600SemiBold,
  BodoniModa_500Medium_Italic,
};
