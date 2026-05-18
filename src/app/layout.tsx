import type { Metadata } from 'next'
import { getServerSession } from '@/lib/auth'
import Header from '@/components/shop/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ecommerce',
  description: 'Tu tienda online',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <html lang="es">
      <body>
        <Header session={session} />
        <main>{children}</main>
      </body>
    </html>
  )
}
