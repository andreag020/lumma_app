import {
  parseTime,
  buildPhraseNotificationContent,
} from '../../src/services/notificationText';
import type { DailyContent } from '../../src/models';

describe('parseTime', () => {
  test('parses "HH:mm" into [hour, minute]', () => {
    expect(parseTime('21:00')).toEqual([21, 0]);
    expect(parseTime('07:05')).toEqual([7, 5]);
  });
});

describe('buildPhraseNotificationContent', () => {
  const content: DailyContent = {
    contentId: 'leo-2026-07-13',
    date: '2026-07-13',
    zodiacSign: 'leo',
    shortAstrologyText: 'No necesitas iluminar toda la sala hoy.',
    dailyPhrase: 'Descansar también es una forma de reinar.',
    extendedText: null,
  };

  test('titles with the sign label, styled like a newspaper column', () => {
    const { title } = buildPhraseNotificationContent('leo', content);
    expect(title).toBe('Leo · tu lectura de hoy');
  });

  test('uses the astrology reading (not the generic phrase) as the body', () => {
    const { body } = buildPhraseNotificationContent('leo', content);
    expect(body).toBe(content.shortAstrologyText);
  });
});
