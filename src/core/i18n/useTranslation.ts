import { useProfileStore } from '../../stores/profileStore';
import { DEFAULT_LANGUAGE, type Language } from '../../models/language';
import { translate } from './translate';
import type { StringKey } from './strings';

/**
 * Hook de traducción. Por defecto usa el idioma guardado en el perfil;
 * pasa `overrideLanguage` en pantallas sin perfil todavía (onboarding),
 * donde el idioma vive en estado local (detectado del dispositivo).
 */
export function useTranslation(overrideLanguage?: Language) {
  const profileLanguage = useProfileStore((s) => s.profile?.language);
  const language = overrideLanguage ?? profileLanguage ?? DEFAULT_LANGUAGE;
  return {
    language,
    t: (key: StringKey, vars?: Record<string, string | number>) =>
      translate(language, key, vars),
  };
}
