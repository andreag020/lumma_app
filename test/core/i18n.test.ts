import { STRINGS } from '../../src/core/i18n/strings';
import { translate } from '../../src/core/i18n/translate';

describe('STRINGS', () => {
  test('es and en expose the exact same set of keys', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.es).sort());
  });
});

describe('translate', () => {
  test('interpolates variables', () => {
    expect(translate('es', 'greetingWithName', { name: 'Andrea' })).toBe(
      'Hola, Andrea'
    );
    expect(translate('en', 'greetingWithName', { name: 'Andrea' })).toBe(
      'Hi, Andrea'
    );
  });

  test('returns the key text unmodified when there are no variables', () => {
    expect(translate('es', 'save')).toBe('Guardar');
    expect(translate('en', 'save')).toBe('Save');
  });
});
