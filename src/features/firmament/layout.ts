import { dayOfYear, isLeapYear, yearOf } from '../../core/utils/date';
import type { DailyEntry } from '../../models';

/** Columnas por defecto de la grilla del firmamento (constante visual). */
export const FIRMAMENT_COLUMNS = 20;

export interface GridPosition {
  /** Posición horizontal normalizada (0–1, centro de la celda). */
  x: number;
  /** Posición vertical normalizada (0–1, centro de la celda). */
  y: number;
  row: number;
  col: number;
  rows: number;
}

/**
 * Mapea un día del año (1-indexado) a una posición normalizada en una
 * grilla de `columns` columnas. Pura y determinista: sin ella, cada
 * registro es un punto de luz reproducible en el mismo lugar siempre.
 */
export function dayToGridPosition(
  day: number,
  totalDays: number,
  columns: number = FIRMAMENT_COLUMNS
): GridPosition {
  const rows = Math.ceil(totalDays / columns);
  const index = day - 1;
  const row = Math.floor(index / columns);
  const col = index % columns;
  return {
    x: (col + 0.5) / columns,
    y: (row + 0.5) / rows,
    row,
    col,
    rows,
  };
}

/** Número de días del año (365 o 366). */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export interface FirmamentPoint extends GridPosition {
  date: string;
  color: string;
  label: string;
}

/**
 * Convierte los registros de un año en puntos de luz posicionados en la
 * grilla del firmamento. Ignora registros fuera del año pedido.
 */
export function entriesToFirmamentPoints(
  entries: DailyEntry[],
  year: number,
  columns: number = FIRMAMENT_COLUMNS
): FirmamentPoint[] {
  const totalDays = daysInYear(year);
  return entries
    .filter((e) => yearOf(e.date) === year)
    .map((e) => {
      const pos = dayToGridPosition(dayOfYear(e.date), totalDays, columns);
      return { ...pos, date: e.date, color: e.moodColor, label: e.moodLabel };
    });
}

/** Posición de cada día del año (para el fondo tenue de "cielo completo"). */
export function allDaysGridPositions(
  year: number,
  columns: number = FIRMAMENT_COLUMNS
): GridPosition[] {
  const totalDays = daysInYear(year);
  const positions: GridPosition[] = [];
  for (let day = 1; day <= totalDays; day++) {
    positions.push(dayToGridPosition(day, totalDays, columns));
  }
  return positions;
}
