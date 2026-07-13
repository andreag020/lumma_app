/** Genera un ID local simple. Un solo perfil por instalación, así que no
 * hace falta una librería de UUID: no hay riesgo real de colisión. */
export function generateLocalId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
