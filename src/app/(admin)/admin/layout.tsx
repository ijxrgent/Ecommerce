import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth'
import styles from './admin.layout.module.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>Panel Admin</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin/dashboard" className={styles.navLink}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link href="/admin/products" className={styles.navLink}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
            Productos
          </Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
