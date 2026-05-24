'use client'

import { useState, useEffect, useRef } from 'react'
import ProductForm from '@/components/admin/ProductForm'
import Image from 'next/image'
import styles from './products.module.css'

interface Category {
  id: string
  name: string
}
interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  featured: boolean
  categoryId: string
  category: { name: string }
  createdAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  // Ref para evitar la advertencia
  const hasLoaded = useRef(false)

  // Función para cargar productos
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=50')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Función para cargar categorías
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Función para cargar todos los datos
  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([loadProducts(), loadCategories()])
    setLoading(false)
  }

  useEffect(() => {
    // Solo cargar una vez
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadAllData()
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setShowForm(true)
  }
  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  function handleSuccess() {
    closeForm()
    loadAllData()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      await loadAllData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Productos</h1>
          <p className={styles.count}>{products.length} productos</p>
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
          Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className={styles.empty}>Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1.5"
          >
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
          <p>No hay productos aún</p>
          <button className={styles.btnCreate} onClick={openCreate}>
            Crear el primero
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.cardImage}>
                {product.imageUrl && product.imageUrl !== '/placeholder.svg' ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className={styles.noImage}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
                {product.featured && (
                  <span className={styles.featuredBadge}>Destacado</span>
                )}
              </div>

              <div className={styles.cardBody}>
                <p className={styles.cardCategory}>{product.category.name}</p>
                <h3 className={styles.cardName}>{product.name}</h3>
                <p className={styles.cardDesc}>{product.description}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.price}>
                    ${(product.price / 100).toFixed(2)}
                  </span>
                  <span className={styles.stock}>Stock: {product.stock}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.btnEdit}
                  onClick={() => openEdit(product)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </button>
                <button
                  className={styles.btnDelete}
                  onClick={() => handleDelete(product.id)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onSuccess={handleSuccess}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
