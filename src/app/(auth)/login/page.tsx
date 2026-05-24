'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }

      // Redirigir según rol
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push(from)
      }
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Bienvenido de vuelta</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
