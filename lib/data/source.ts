/**
 * Indica si aún se usan datos de demostración en memoria.
 * Las pantallas pueden seguir leyendo `mock-data` hasta que cada módulo
 * consuma Turso o Supabase vía repositorios.
 */
export function isUsingMockDataset(): boolean {
  return true
}
