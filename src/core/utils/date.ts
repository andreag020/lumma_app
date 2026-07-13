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
