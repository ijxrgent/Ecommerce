import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...\n')

  // ─── Admin ───────────────────────────────────────────────────────────────

  const adminEmail = 'admin@ecommerce.com'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('⚠️  Admin ya existe, saltando...')
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    })

    console.log('✅ Admin creado:')
    console.log('   📧 Email   :', admin.email)
    console.log('   🔑 Password: admin123')
    console.log('   🪪 Role    :', admin.role)
  }

  // ─── Categorías ───────────────────────────────────────────────────────────

  const categories = [
    {
      name: 'Electrónica',
      slug: 'electronica',
      imageUrl:
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    },
    {
      name: 'Ropa',
      slug: 'ropa',
      imageUrl:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    },
    {
      name: 'Hogar',
      slug: 'hogar',
      imageUrl:
        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log(`\n✅ ${categories.length} categorías creadas`)

  // ─── Productos de ejemplo ─────────────────────────────────────────────────

  const electronica = await prisma.category.findUnique({
    where: { slug: 'electronica' },
  })
  const ropa = await prisma.category.findUnique({ where: { slug: 'ropa' } })
  const hogar = await prisma.category.findUnique({ where: { slug: 'hogar' } })

  if (!electronica || !ropa || !hogar) {
    throw new Error('No se encontraron las categorías necesarias')
  }

  const products = [
    {
      name: 'Auriculares Bluetooth',
      slug: 'auriculares-bluetooth',
      description:
        'Auriculares inalámbricos con cancelación de ruido y 30h de batería.',
      price: 8999,
      stock: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      featured: true,
      categoryId: electronica.id,
    },
    {
      name: 'Smartwatch Pro',
      slug: 'smartwatch-pro',
      description:
        'Reloj inteligente con monitor de salud, GPS y resistencia al agua.',
      price: 19999,
      stock: 15,
      imageUrl:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      featured: true,
      categoryId: electronica.id,
    },
    {
      name: 'Camiseta Premium',
      slug: 'camiseta-premium',
      description:
        'Camiseta de algodón 100% orgánico, disponible en varios colores.',
      price: 2999,
      stock: 100,
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
      featured: false,
      categoryId: ropa.id,
    },
    {
      name: 'Lámpara de Escritorio',
      slug: 'lampara-escritorio',
      description:
        'Lámpara LED regulable con puerto USB y temperatura de color ajustable.',
      price: 4999,
      stock: 40,
      imageUrl:
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600',
      featured: true,
      categoryId: hogar.id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log(`✅ ${products.length} productos creados`)
  console.log('\n🎉 Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
