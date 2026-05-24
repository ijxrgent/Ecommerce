'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './ProductForm.module.css'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number // centavos en DB
  stock: number
  imageUrl: string
  featured: boolean
  categoryId: string
}

interface ProductFormProps {
  product?: Product | null // si viene → edición, si no → creación
  categories: Category[]
  onSuccess: () => void
  onClose: () => void
}

export default function ProductForm({
  product,
  categories,
  onSuccess,
  onClose,
}: ProductFormProps) {
  const isEditing = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? (product.price / 100).toFixed(2) : '',
    stock: product?.stock.toString() ?? '0',
    imageUrl: product?.imageUrl ?? '',
    featured: product?.featured ?? false,
    categoryId: product?.categoryId ?? categories[0]?.id ?? '',
  })

  const [preview, setPreview] = useState<string>(product?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local inmediato
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al subir imagen')
        setPreview(form.imageUrl) // revertir preview
        return
      }

      // Guardamos la URL persistente en el form
      setForm((prev) => ({ ...prev, imageUrl: data.url }))
      setPreview(data.url)
    } catch {
      setError('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body = {
        name: form.name,
        description: form.description,
        price: form.price, // string → validations.ts lo convierte a centavos
        stock: Number(form.stock),
        imageUrl: form.imageUrl || '/placeholder.svg',
        featured: form.featured,
        categoryId: form.categoryId,
      }

      const url = isEditing ? `/api/products/${product!.id}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar producto')
        return
      }

      onSuccess()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Click en el overlay cierra el modal
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg
              width="20"
              height="20"
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
          {/* Imagen */}
          <div className={styles.imageSection}>
            <div
              className={styles.imagePreview}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && fileInputRef.current?.click()
              }
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  className={styles.previewImg}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  {/* Icono cámara SVG */}
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  >
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Seleccionar imagen</span>
                  <span className={styles.imageMeta}>
                    JPG, PNG, WEBP · máx 5MB · opcional
                  </span>
                </div>
              )}
              {uploading && (
                <div className={styles.uploadingOverlay}>
                  <span>Subiendo...</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {preview && (
              <button
                type="button"
                className={styles.removeImage}
                onClick={() => {
                  setPreview('')
                  setForm((p) => ({ ...p, imageUrl: '' }))
                }}
              >
                Quitar imagen
              </button>
            )}
          </div>

          {/* Campos */}
          <div className={styles.field}>
            <label htmlFor="name">Nombre *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Auriculares Bluetooth"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Descripción *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe el producto..."
              rows={3}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="price">Precio ($) *</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="29.99"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="stock">Stock *</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="categoryId">Categoría *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
            />
            Producto destacado
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading || uploading}
            >
              {loading
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
