import { generateLocalId } from '../../src/core/utils/id';
import { todayISODate } from '../../src/core/utils/date';

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
