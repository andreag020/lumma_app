import {
  parseTime,
  pickReminderMessage,
  REMINDER_MESSAGES,
} from '../../src/services/notificationText';

describe('parseTime', () => {
  test('parses "HH:mm" into [hour, minute]', () => {
    expect(parseTime('21:00')).toEqual([21, 0]);
    expect(parseTime('07:05')).toEqual([7, 5]);
  });
});

describe('pickReminderMessage', () => {
  test('always returns a message from the pool', () => {
    for (const seed of ['21:00', '07:00', '18:00', '', 'abc']) {
      expect(REMINDER_MESSAGES).toContain(pickReminderMessage(seed));
    }
  });

  test('is deterministic for the same seed', () => {
    expect(pickReminderMessage('21:00')).toBe(pickReminderMessage('21:00'));
  });
});
