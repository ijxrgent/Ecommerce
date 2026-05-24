import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getSession, requireAdmin } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { error: 'No se envió ningún archivo' },
      { status: 400 }
    )
  }

  // Validar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP o GIF' },
      { status: 400 }
    )
  }

  // Validar tamaño
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `El archivo no puede superar ${MAX_SIZE_MB}MB` },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Nombre único: timestamp + nombre original sanitizado
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Guardar en /public/uploads (persiste entre recargas)
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, safeName), buffer)

  // La URL pública que se guarda en DB
  const url = `/uploads/${safeName}`

  return NextResponse.json({ url }, { status: 201 })
}
