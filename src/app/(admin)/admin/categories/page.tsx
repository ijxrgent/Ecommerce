'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './categories.module.css'

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  _count: { products: number }
}

type FormState = { name: string; imageUrl: string }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', imageUrl: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Ref para evitar la advertencia
  const hasLoaded = useRef(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solo cargar una vez
    if (!hasLoaded.current) {
      hasLoaded.current = true
      fetchCategories()
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', imageUrl: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, imageUrl: cat.imageUrl ?? '' })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      closeForm()
      fetchCategories()
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(cat: Category) {
    setDeleteError('')

    if (cat._count.products > 0) {
      setDeleteError(
        `No puedes eliminar "${cat.name}" porque tiene ${cat._count.products} producto${cat._count.products > 1 ? 's' : ''} asociado${cat._count.products > 1 ? 's' : ''}.`
      )
      return
    }

    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return

    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setDeleteError(data.error)
      return
    }

    fetchCategories()
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Categorías</h1>
          <p className={styles.count}>{categories.length} categorías</p>
        </div>
        <button className={styles.btnCreate} onClick={openCreate}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva categoría
        </button>
      </div>

      {/* Error de borrado */}
      {deleteError && (
        <div className={styles.alertError}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {deleteError}
          <button
            onClick={() => setDeleteError('')}
            className={styles.alertClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className={styles.empty}>Cargando...</div>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1.5"
          >
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <p>No hay categorías</p>
          <button className={styles.btnCreate} onClick={openCreate}>
            Crear la primera
          </button>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className={styles.tdName}>{cat.name}</td>
                <td className={styles.tdSlug}>{cat.slug}</td>
                <td>
                  <span
                    className={
                      cat._count.products > 0
                        ? styles.countBadge
                        : styles.countBadgeEmpty
                    }
                  >
                    {cat._count.products} producto
                    {cat._count.products !== 1 ? 's' : ''}
                  </span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => openEdit(cat)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDelete(cat)}
                      disabled={cat._count.products > 0}
                      title={
                        cat._count.products > 0
                          ? 'Tiene productos asociados'
                          : 'Eliminar'
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showForm && (
        <div
          className={styles.overlay}
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button className={styles.closeBtn} onClick={closeForm}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">Nombre *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ej: Electrónica"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="imageUrl">
                  URL de imagen{' '}
                  <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Guardando...'
                    : editing
                      ? 'Guardar cambios'
                      : 'Crear categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
