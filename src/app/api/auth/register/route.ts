//src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'
import { parseBody, registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  // 1. Validar el body con Zod
  const { data, error } = await parseBody(request, registerSchema)
  if (error || !data) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const { name, email, password } = data

  // 2. Verificar que el email no esté registrado
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Este email ya está registrado' },
      { status: 409 }
    )
  }

  // 3. Hashear la contraseña (nunca guardar plain text)
  // Salt rounds = 12: buen balance entre seguridad y velocidad
  const hashedPassword = await bcrypt.hash(password, 12)

  // 4. Crear el usuario en DB
  const user = await db.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true }, // nunca devolver password
  })

  // 5. Firmar JWT y establecer cookie
  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  const response = NextResponse.json(
    { user, message: 'Cuenta creada exitosamente' },
    { status: 201 }
  )

  setAuthCookie(response, token)
  return response
}
