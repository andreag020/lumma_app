import {
  parseTime,
  pickPhraseReminderMessage,
  PHRASE_REMINDER_MESSAGES,
} from '../../src/services/notificationText';

describe('parseTime', () => {
  test('parses "HH:mm" into [hour, minute]', () => {
    expect(parseTime('21:00')).toEqual([21, 0]);
    expect(parseTime('07:05')).toEqual([7, 5]);
  });
});

describe('pickPhraseReminderMessage', () => {
  test('always returns a message from the pool', () => {
    for (const seed of ['21:00', '07:00', '18:00', '', 'abc']) {
      expect(PHRASE_REMINDER_MESSAGES).toContain(pickPhraseReminderMessage(seed));
    }
  });

  test('is deterministic for the same seed', () => {
    expect(pickPhraseReminderMessage('21:00')).toBe(
      pickPhraseReminderMessage('21:00')
    );
  });
});
