/** Fecha de hoy en la zona horaria local, formato "YYYY-MM-DD". */
export function todayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Día del año (1–366) a partir de una fecha ISO "YYYY-MM-DD". */
export function dayOfYear(isoDate: string): number {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  return Math.floor(diff / 86_400_000);
}

/** Año calendario (UTC) de una fecha ISO "YYYY-MM-DD". */
export function yearOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCFullYear();
}

/** true si el año es bisiesto (366 días). */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Suma (o resta, con `days` negativo) días a una fecha ISO "YYYY-MM-DD". */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

import type { Language } from '../../models/language';

const MONTHS: Record<Language, string[]> = {
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

/** "2026-07-15" → "15 de julio de 2026" (es) o "July 15, 2026" (en). Sin
 * depender de Intl, para que funcione igual en cualquier motor/entorno. */
export function formatLongDate(isoDate: string, language: Language): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const monthName = MONTHS[language][month - 1];
  return language === 'en'
    ? `${monthName} ${day}, ${year}`
    : `${day} de ${monthName} de ${year}`;
}
