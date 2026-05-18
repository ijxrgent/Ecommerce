import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'

// ─── Rutas protegidas ─────────────────────────────────────────────────────────
//
// /admin/*          → solo ADMIN
// /api/admin/*      → solo ADMIN
// /checkout         → cualquier usuario autenticado
// /orders           → cualquier usuario autenticado
// /api/orders       → cualquier usuario autenticado

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession(request)

  // ── Rutas exclusivas para ADMIN ────────────────────────────────────────────

  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  if (isAdminPage || isAdminApi) {
    // Sin sesión → redirigir al login
    if (!session) {
      return redirectToLogin(request, pathname)
    }

    // Con sesión pero no es admin → 403
    if (!requireAdmin(session)) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Si intenta entrar a /admin desde el browser, lo mandamos al home
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  }

  // ── Rutas que requieren estar autenticado (cualquier rol) ──────────────────

  const isProtectedPage =
    pathname.startsWith('/checkout') || pathname.startsWith('/orders')
  const isProtectedApi = pathname.startsWith('/api/orders')

  if (isProtectedPage || isProtectedApi) {
    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return redirectToLogin(request, pathname)
    }

    return NextResponse.next()
  }

  // ── Rutas de auth: redirigir si ya hay sesión activa ──────────────────────
  // Evita que un usuario logueado entre a /login o /register

  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Todo lo demás: dejar pasar ────────────────────────────────────────────
  return NextResponse.next()
}

// ─── Helper: redirigir al login guardando la ruta de origen ──────────────────
// Después del login exitoso puedes redirigir al usuario de vuelta a donde iba

function redirectToLogin(request: NextRequest, from: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', from) // /login?from=/checkout
  return NextResponse.redirect(loginUrl)
}

// ─── Matcher: en qué rutas se ejecuta el middleware ───────────────────────────
// Next.js NO corre el middleware en archivos estáticos (_next, imágenes, etc.)
// Solo se activa en las rutas que listamos aquí

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/api/orders/:path*',
    '/login',
    '/register',
  ],
}
