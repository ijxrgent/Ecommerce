//src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'
import { parseBody, loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  // 1. Validar el body con Zod
  const { data, error } = await parseBody(request, loginSchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const { email, password } = data

  // 2. Buscar usuario por email
  const user = await db.user.findUnique({ where: { email } })

  // 3. Verificar contraseña
  // Importante: comparamos aunque el usuario no exista (evita timing attacks)
  // Si el usuario no existe, comparamos contra un hash falso para que tarde lo mismo
  const dummyHash =
    '$2b$12$invalidhashfortimingattackprevention000000000000000000'
  const isValid = await bcrypt.compare(password, user?.password ?? dummyHash)

  if (!user || !isValid) {
    // Mensaje genérico: no revelar si el email existe o no
    return NextResponse.json(
      { error: 'Email o contraseña incorrectos' },
      { status: 401 }
    )
  }

  // 4. Firmar JWT y establecer cookie
  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: 'Sesión iniciada',
  })

  setAuthCookie(response, token)
  return response
}
