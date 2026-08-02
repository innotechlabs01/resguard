import { z } from 'zod'
import { NextResponse } from 'next/server'

export const CreatePaymentSchema = z.object({
  amount: z.number().min(0).max(100_000_000),
  amountType: z.enum(['OPEN', 'CLOSE']),
  description: z.string().min(1).max(100),
  residentEmail: z.string().email().optional(),
  residentUnit: z.string().max(20).optional(),
  buildingId: z.string().uuid(),
  buildingName: z.string().max(100).optional(),
  paymentType: z.enum(['subscription', 'overtime_fee', 'reservation', 'fine']),
})

export const CreateUserSchema = z.object({
  clerk_user_id: z.string().optional().default(''),
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(['super_admin', 'admin', 'vigilante', 'usuario']),
  building_id: z.string().uuid().optional().default(''),
})

export const CreateVisitorSchema = z.object({
  building_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  document_id: z.string().min(1).max(20),
  type: z.enum(['pedestrian', 'vehicle']),
  vehicle_plate: z.string().max(10).optional(),
  destination_unit: z.string().min(1).max(20),
  resident_name: z.string().min(1).max(200),
})

export const CreateParkingSchema = z.object({
  building_id: z.string().uuid(),
  code: z.string().min(1).max(10),
  status: z.enum(['available', 'occupied', 'reserved', 'overtime']),
  vehicle_plate: z.string().max(10).optional(),
  visitor_name: z.string().max(200).optional(),
  resident_unit: z.string().max(20).optional(),
  max_duration: z.number().min(1).max(480),
})

export const CreateBuildingSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  total_units: z.number().min(1).max(10000),
  total_parking_spots: z.number().min(0).max(10000),
  visitor_parking_spots: z.number().min(0).max(1000),
  monthly_fee: z.number().min(0).max(100_000_000),
  currency: z.string().min(3).max(3),
})

export function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validación fallida', details: errors },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}
