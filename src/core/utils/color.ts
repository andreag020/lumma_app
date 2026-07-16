/** Convierte un hex `#RRGGBB` a `rgba(r, g, b, alpha)` — para tintar
 * elementos decorativos (p. ej. los puntos de fondo del firmamento) con
 * el color de texto del tema activo en vez de un valor fijo. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
