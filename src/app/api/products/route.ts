import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { parseBody, productSchema } from '@/lib/validations'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/products — público
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 12))
  const category = searchParams.get('category') ?? undefined
  const featured = searchParams.get('featured')

  const where = {
    ...(category && { category: { slug: category } }),
    ...(featured === 'true' && { featured: true }),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ])

  return NextResponse.json({ products, total, page, limit })
}

// POST /api/products — solo admin
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await parseBody(request, productSchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  // Generar slug único
  let slug = slugify(data.name)
  const existing = await db.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const product = await db.product.create({
    data: { ...data, slug },
    include: { category: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(product, { status: 201 })
}
