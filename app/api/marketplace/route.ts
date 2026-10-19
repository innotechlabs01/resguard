import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getMarketplaceProducts, createMarketplaceProduct, deleteMarketplaceProduct } from '@/lib/db/queries/marketplace'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/marketplace' })

const CreateProductSchema = z.object({
  building_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  price: z.number().min(0).max(100_000_000),
  category: z.enum(['food', 'services', 'handmade', 'other']),
  contact_phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
})

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const products = await getMarketplaceProducts(buildingId)
    return NextResponse.json({ products })
  } catch (error) {
    log.error({ error }, 'Error fetching marketplace products')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = CreateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const access = assertBuildingAccess(user, parsed.data.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    await createMarketplaceProduct({
      seller_id: user.id,
      seller_name: user.name || user.email,
      seller_unit: '',
      building_id: parsed.data.building_id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      category: parsed.data.category,
      available: true,
      contact_phone: parsed.data.contact_phone || '',
      whatsapp: parsed.data.whatsapp || null,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating marketplace product')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    // Only super_admin or the seller can delete
    if (user.role !== 'super_admin') {
      const { getMarketplaceProductById } = await import('@/lib/db/queries/marketplace')
      const product = await getMarketplaceProductById(id)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      if (product.seller_id !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Admin can only delete products in their building
      if (user.role === 'admin' && product.building_id !== user.building_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await deleteMarketplaceProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error deleting marketplace product')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
