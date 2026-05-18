//src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada' })
  clearAuthCookie(response)
  return response
}
