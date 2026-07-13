import {
  dayToGridPosition,
  daysInYear,
  entriesToFirmamentPoints,
  allDaysGridPositions,
  FIRMAMENT_COLUMNS,
} from '../../../src/features/firmament/layout';
import type { DailyEntry } from '../../../src/models';

describe('dayToGridPosition', () => {
  test('day 1 maps to the first cell (row 0, col 0)', () => {
    const pos = dayToGridPosition(1, 365, 20);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(0);
  });

  test('day 21 wraps to the next row at column 20', () => {
    const pos = dayToGridPosition(21, 365, 20);
    expect(pos.row).toBe(1);
    expect(pos.col).toBe(0);
  });

  test('day 20 stays in row 0 at the last column', () => {
    const pos = dayToGridPosition(20, 365, 20);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(19);
  });

  test('normalized coordinates stay within (0, 1)', () => {
    for (const day of [1, 100, 200, 365]) {
      const pos = dayToGridPosition(day, 365, 20);
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.x).toBeLessThan(1);
      expect(pos.y).toBeGreaterThan(0);
      expect(pos.y).toBeLessThan(1);
    }
  });

  test('is deterministic: same input always yields the same position', () => {
    const a = dayToGridPosition(150, 365, 20);
    const b = dayToGridPosition(150, 365, 20);
    expect(a).toEqual(b);
  });
});

describe('daysInYear', () => {
  test('366 on a leap year, 365 otherwise', () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
  });
});

describe('entriesToFirmamentPoints', () => {
  const entries: DailyEntry[] = [
    {
      entryId: 'e1',
      date: '2026-01-01',
      moodColor: '#E5C46B',
      moodLabel: 'Alegría',
      note: null,
      dailyPhraseId: null,
      astrologyMessageId: null,
    },
    {
      entryId: 'e2',
      date: '2026-12-31',
      moodColor: '#C7B6F2',
      moodLabel: 'Calma',
      note: null,
      dailyPhraseId: null,
      astrologyMessageId: null,
    },
    {
      entryId: 'e3',
      date: '2025-06-15', // otro año: debe excluirse
      moodColor: '#B6D77A',
      moodLabel: 'Gratitud',
      note: null,
      dailyPhraseId: null,
      astrologyMessageId: null,
    },
  ];

  test('N registros del año → N puntos, excluyendo otros años', () => {
    const points = entriesToFirmamentPoints(entries, 2026);
    expect(points).toHaveLength(2);
    expect(points.map((p) => p.date).sort()).toEqual([
      '2026-01-01',
      '2026-12-31',
    ]);
  });

  test('cada punto conserva el color y la etiqueta del registro', () => {
    const [point] = entriesToFirmamentPoints(
      [entries[0]],
      2026
    );
    expect(point.color).toBe('#E5C46B');
    expect(point.label).toBe('Alegría');
  });

  test('el primer día del año cae en la primera celda', () => {
    const [point] = entriesToFirmamentPoints([entries[0]], 2026);
    expect(point.row).toBe(0);
    expect(point.col).toBe(0);
  });
});

describe('allDaysGridPositions', () => {
  test('genera una posición por cada día del año', () => {
    expect(allDaysGridPositions(2026, FIRMAMENT_COLUMNS)).toHaveLength(365);
    expect(allDaysGridPositions(2024, FIRMAMENT_COLUMNS)).toHaveLength(366);
  });
});
