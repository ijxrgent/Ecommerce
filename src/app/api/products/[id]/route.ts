import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { parseBody, updateProductSchema } from '@/lib/validations'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/products/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { name: true, slug: true } } },
  })

  if (!product) {
    return NextResponse.json(
      { error: 'Producto no encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json(product)
}

// PUT /api/products/:id — solo admin
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { data, error } = await parseBody(request, updateProductSchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const product = await db.product.update({
    where: { id },
    data,
    include: { category: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(product)
}

// DELETE /api/products/:id — solo admin
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await db.product.delete({ where: { id } })

  return NextResponse.json({ message: 'Producto eliminado' })
}
