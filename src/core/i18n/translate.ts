import type { Language } from '../../models/language';
import { STRINGS, type StringKey } from './strings';

/** Traducción pura, sin dependencias de React ni de la base local — segura
 * de usar en lógica testeable sin runtime nativo (p. ej. notificationText.ts). */
export function translate(
  language: Language,
  key: StringKey,
  vars?: Record<string, string | number>
): string {
  let text = STRINGS[language][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{{${name}}}`, String(value));
    }
  }
  return text;
}
