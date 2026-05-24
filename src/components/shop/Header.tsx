'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SessionPayload } from '@/lib/auth'
import styles from './Header.module.css'

interface HeaderProps {
  session: SessionPayload | null
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/') // refresca los Server Components para que session sea null
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          🛍️ Ecommerce
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          <Link href="/products">Productos</Link>
          {session?.role === 'ADMIN' && (
            <Link href="/admin/dashboard">Admin</Link>
          )}
        </nav>

        {/* Auth */}
        <div className={styles.auth}>
          {session ? (
            <>
              <span className={styles.greeting}>
                Hola, {session.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className={styles.btnOutline}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.btnOutline}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={styles.btnPrimary}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
