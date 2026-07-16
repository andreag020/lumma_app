import {
  profileToRow,
  profileFromRow,
  dailyEntryToRow,
  dailyEntryFromRow,
  dailyContentToRow,
  dailyContentFromRow,
  adsConfigToRow,
  adsConfigFromRow,
  isZodiacSign,
  type Profile,
  type DailyEntry,
  type DailyContent,
  type AdsConfig,
} from '../../src/models';

describe('model row round-trips', () => {
  test('Profile survives toRow → fromRow', () => {
    const profile: Profile = {
      userIdLocal: 'local-1',
      nickname: 'Andrea',
      zodiacSign: 'leo',
      birthDate: null,
      notificationTime: '21:00',
      moodReminderEnabled: true,
      moodReminderTime: '20:00',
      language: 'es',
      enabledModules: ['astrology', 'mood'],
      themePreferences: { accent: 'gold' },
    };
    expect(profileFromRow(profileToRow(profile))).toEqual(profile);
  });

  test('DailyEntry survives round-trip with null note', () => {
    const entry: DailyEntry = {
      entryId: 'e-1',
      date: '2026-07-13',
      moodColor: '#E5C46B',
      moodLabel: 'calma',
      note: null,
      dailyPhraseId: 'p-1',
      astrologyMessageId: null,
    };
    expect(dailyEntryFromRow(dailyEntryToRow(entry))).toEqual(entry);
  });

  test('DailyContent survives round-trip', () => {
    const content: DailyContent = {
      contentId: 'c-1',
      date: '2026-07-13',
      zodiacSign: 'piscis',
      language: 'es',
      shortAstrologyText: 'Hoy el cielo invita a la calma.',
      dailyPhrase: 'Cada día deja un brillo.',
      extendedText: null,
    };
    expect(dailyContentFromRow(dailyContentToRow(content))).toEqual(content);
  });

  test('AdsConfig maps booleans to integers correctly', () => {
    const config: AdsConfig = {
      adsRemoved: true,
      consentStatus: 'granted',
      lastConsentCheck: '2026-07-13T10:00:00.000Z',
    };
    const row = adsConfigToRow(config);
    expect(row.ads_removed).toBe(1);
    expect(adsConfigFromRow(row)).toEqual(config);
  });
});

describe('zodiac guard', () => {
  test('accepts valid signs and rejects invalid', () => {
    expect(isZodiacSign('leo')).toBe(true);
    expect(isZodiacSign('dragon')).toBe(false);
  });
});
