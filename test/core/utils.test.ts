import { generateLocalId } from '../../src/core/utils/id';
import { todayISODate, addDays } from '../../src/core/utils/date';

describe('generateLocalId', () => {
  test('includes the given prefix and produces unique values', () => {
    const a = generateLocalId('user');
    const b = generateLocalId('user');
    expect(a.startsWith('user_')).toBe(true);
    expect(a).not.toEqual(b);
  });
});

describe('todayISODate', () => {
  test('returns a YYYY-MM-DD formatted date', () => {
    expect(todayISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('addDays', () => {
  test('adds days within the same month', () => {
    expect(addDays('2026-07-13', 5)).toBe('2026-07-18');
  });

  test('rolls over into the next month', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02');
  });

  test('rolls over into the next year', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  test('supports negative offsets', () => {
    expect(addDays('2026-07-13', -1)).toBe('2026-07-12');
  });

  test('offset 0 returns the same date', () => {
    expect(addDays('2026-07-13', 0)).toBe('2026-07-13');
  });
});
