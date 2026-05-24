import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { parseBody, categorySchema } from '@/lib/validations'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/categories — público, incluye conteo de productos
export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: true } },
    },
  })
  return NextResponse.json({ categories })
}

// POST /api/categories — solo admin
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await parseBody(request, categorySchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const slug = slugify(data.name)

  const existing = await db.category.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una categoría con ese nombre' },
      { status: 409 }
    )
  }

  const category = await db.category.create({
    data: { ...data, slug },
    include: { _count: { select: { products: true } } },
  })

  return NextResponse.json(category, { status: 201 })
}
