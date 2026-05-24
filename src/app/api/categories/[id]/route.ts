import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { parseBody, categorySchema } from '@/lib/validations'

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/categories/:id — solo admin
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { data, error } = await parseBody(request, categorySchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const category = await db.category.update({
    where: { id },
    data,
  })

  return NextResponse.json(category)
}

// DELETE /api/categories/:id — solo admin, protegido si tiene productos
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verificar si tiene productos asociados
  const productCount = await db.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return NextResponse.json(
      {
        error: `No se puede eliminar: esta categoría tiene ${productCount} producto${productCount > 1 ? 's' : ''} asociado${productCount > 1 ? 's' : ''}`,
      },
      { status: 409 }
    )
  }

  await db.category.delete({ where: { id } })
  return NextResponse.json({ message: 'Categoría eliminada' })
}
