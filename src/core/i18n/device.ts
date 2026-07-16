import * as Localization from 'expo-localization';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type Language } from '../../models/language';

/** Idioma del dispositivo, acotado a los idiomas que Lumma soporta hoy
 * (es/en) — usado para preseleccionar el idioma en el onboarding, antes
 * de que exista un perfil guardado. */
export function detectDeviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LANGUAGE;
  return isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
}
