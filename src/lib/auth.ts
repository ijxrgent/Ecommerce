import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Role = 'USER' | 'ADMIN'

export interface SessionPayload {
  id: string
  email: string
  name: string
  role: Role
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const COOKIE_NAME = 'auth-token'
const EXPIRATION = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret)
    throw new Error('JWT_SECRET no está definido en las variables de entorno')
  return new TextEncoder().encode(secret)
}

// ─── Firmar token ─────────────────────────────────────────────────────────────

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret())
}

// ─── Verificar token ──────────────────────────────────────────────────────────

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    // Token inválido, expirado o manipulado
    return null
  }
}

// ─── Obtener sesión desde un Request (para Route Handlers y Middleware) ───────

export async function getSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── Obtener sesión desde Server Components (usa next/headers) ───────────────

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── Establecer cookie de autenticación ──────────────────────────────────────

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, // No accesible desde JS del browser (protege contra XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'lax', // Protege contra CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
    path: '/',
  })
}

// ─── Limpiar cookie (logout) ──────────────────────────────────────────────────

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expira inmediatamente
    path: '/',
  })
}

// ─── Helper: verificar que el usuario es admin ────────────────────────────────

export function requireAdmin(
  session: SessionPayload | null
): session is SessionPayload {
  return session !== null && session.role === 'ADMIN'
}

// ─── Helper: verificar que hay sesión activa ──────────────────────────────────

export function requireAuth(
  session: SessionPayload | null
): session is SessionPayload {
  return session !== null
}
