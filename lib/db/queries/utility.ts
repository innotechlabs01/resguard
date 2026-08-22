import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbUtilityReading {
  id: string
  building_id: string
  unit_number: string
  service_type: string
  reading_date: string
  previous_reading: number | null
  current_reading: number | null
  consumption: number | null
  rate_per_unit: number | null
  total_charge: number | null
  notes: string | null
  created_at: string
}

export interface DbUtilityBill {
  id: string
  building_id: string
  billing_period: string
  service_type: string
  total_consumption: number | null
  total_charges: number | null
  total_units_billed: number | null
  status: string
  finalized_at: string | null
  created_at: string
}

// ── List readings with optional filters ──

export async function getReadings(
  buildingId: string,
  serviceType?: string,
  unitNumber?: string
): Promise<DbUtilityReading[]> {
  const conditions: InValue[] = [buildingId]
  const wheres: string[] = ['building_id = ?']

  if (serviceType) {
    wheres.push('service_type = ?')
    conditions.push(serviceType)
  }
  if (unitNumber) {
    wheres.push('unit_number = ?')
    conditions.push(unitNumber)
  }

  const sql = `SELECT * FROM utility_readings WHERE ${wheres.join(' AND ')} ORDER BY reading_date DESC`
  return queryMany<DbUtilityReading>(sql, conditions)
}

// ── Create a reading ──

export async function createReading(data: {
  building_id: string
  unit_number: string
  service_type: string
  reading_date: string
  previous_reading: number
  current_reading: number
  rate_per_unit: number
  notes?: string
}): Promise<DbUtilityReading> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO utility_readings (id, building_id, unit_number, service_type, reading_date, previous_reading, current_reading, rate_per_unit, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.unit_number,
      data.service_type,
      data.reading_date,
      data.previous_reading,
      data.current_reading,
      data.rate_per_unit,
      data.notes || null,
    ]
  )
  const created = await queryOne<DbUtilityReading>(
    'SELECT * FROM utility_readings WHERE id = ?',
    [id]
  )
  return created!
}

// ── Get consumption for a specific unit ──

export async function getUnitConsumption(
  buildingId: string,
  unitNumber: string,
  serviceType: string
): Promise<DbUtilityReading[]> {
  return queryMany<DbUtilityReading>(
    `SELECT * FROM utility_readings
     WHERE building_id = ? AND unit_number = ? AND service_type = ?
     ORDER BY reading_date DESC`,
    [buildingId, unitNumber, serviceType]
  )
}

// ── Get building consumption for a period ──

export async function getBuildingConsumption(
  buildingId: string,
  serviceType: string,
  period: string // 'YYYY-MM'
): Promise<{ total_consumption: number; total_charges: number; units_billed: number }> {
  const rows = await queryMany<DbUtilityReading>(
    `SELECT * FROM utility_readings
     WHERE building_id = ? AND service_type = ? AND reading_date >= ? AND reading_date < ?`,
    [buildingId, serviceType, `${period}-01`, `${period}-32`]
  )

  let totalConsumption = 0
  let totalCharges = 0
  const units = new Set<string>()

  for (const row of rows) {
    if (row.consumption) totalConsumption += Number(row.consumption)
    if (row.total_charge) totalCharges += Number(row.total_charge)
    units.add(row.unit_number)
  }

  return {
    total_consumption: Math.round(totalConsumption * 100) / 100,
    total_charges: Math.round(totalCharges * 100) / 100,
    units_billed: units.size,
  }
}

// ── Get consumption alerts (> 2x average) ──

export async function getConsumptionAlerts(
  buildingId: string
): Promise<Array<{ unit_number: string; service_type: string; consumption: number; average: number; ratio: number }>> {
  // Get all readings for the building
  const allReadings = await queryMany<DbUtilityReading>(
    `SELECT * FROM utility_readings WHERE building_id = ? ORDER BY reading_date DESC`,
    [buildingId]
  )

  // Group by service type, compute average and find outliers
  const serviceGroups: Record<string, number[]> = {}
  for (const r of allReadings) {
    if (r.consumption != null) {
      if (!serviceGroups[r.service_type]) serviceGroups[r.service_type] = []
      serviceGroups[r.service_type].push(Number(r.consumption))
    }
  }

  const alerts: Array<{ unit_number: string; service_type: string; consumption: number; average: number; ratio: number }> = []

  for (const [serviceType, consumptions] of Object.entries(serviceGroups)) {
    if (consumptions.length < 2) continue
    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length

    // Check latest reading per unit
    const latestByUnit: Record<string, DbUtilityReading> = {}
    for (const r of allReadings) {
      if (r.service_type === serviceType && r.consumption != null) {
        if (!latestByUnit[r.unit_number]) latestByUnit[r.unit_number] = r
      }
    }

    for (const [, reading] of Object.entries(latestByUnit)) {
      const consumption = Number(reading.consumption)
      if (avg > 0 && consumption > avg * 2) {
        alerts.push({
          unit_number: reading.unit_number,
          service_type: serviceType,
          consumption,
          average: Math.round(avg * 100) / 100,
          ratio: Math.round((consumption / avg) * 100) / 100,
        })
      }
    }
  }

  return alerts
}
