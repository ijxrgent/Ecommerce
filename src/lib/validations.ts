import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string({ message: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(60, 'El nombre es demasiado largo'),

    email: z
      .string({ message: 'El email es requerido' })
      .trim()
      .email({ error: 'Email inválido' })
      .toLowerCase(),

    password: z
      .string({ message: 'La contraseña es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña es demasiado larga')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/\d/, 'Debe contener al menos un número'),

    confirmPassword: z.string({ message: 'Confirma tu contraseña' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z
    .string({ message: 'El email es requerido' })
    .trim()
    .email({ error: 'Email inválido' })
    .toLowerCase(),

  password: z.string({ message: 'La contraseña es requerida' }).min(1),
})

// ─── Categorías ───────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z
    .string({ message: 'El nombre es requerido' })
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),

  imageUrl: z
    .string()
    .trim()
    .url({ error: 'URL inválida' })
    .optional()
    .or(z.literal(''))
    .transform((url) => (url === '' ? null : url)),
})

// ─── Productos ────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z
    .string({ message: 'El nombre es requerido' })
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres'),

  description: z
    .string({ message: 'La descripción es requerida' })
    .trim()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),

  price: z.coerce
    .number({ message: 'El precio es requerido' })
    .positive('El precio debe ser mayor a 0')
    .transform((val) => Math.round(val * 100)),

  stock: z
    .number({ message: 'El stock es requerido' })
    .int('Debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),

  imageUrl: z
    .string({ message: 'La imagen es requerida' })
    .url({ error: 'Debe ser una URL válida' }),

  featured: z.boolean().default(false),

  categoryId: z
    .string({ message: 'La categoría es requerida' })
    .cuid('Categoría inválida'),
})

export const updateProductSchema = productSchema.partial()

// ─── Órdenes ──────────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().cuid('Producto inválido'),
  quantity: z
    .number()
    .int()
    .min(1, 'La cantidad mínima es 1')
    .max(99, 'Máximo 99 unidades por producto'),
})

export const createOrderSchema = z.object({
  address: z
    .string({ message: 'La dirección es requerida' })
    .trim()
    .min(10, 'Dirección demasiado corta')
    .max(200, 'Dirección demasiado larga'),

  items: z.array(orderItemSchema).min(1, 'El carrito está vacío'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    {
      error: 'Estado inválido o no proporcionado',
    }
  ),
})

// ─── Utilidad ─────────────────────────────────────────────────────────────────

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return {
        data: null,
        error: firstError?.message ?? 'Datos inválidos',
      }
    }

    return { data: result.data, error: null }
  } catch {
    return { data: null, error: 'El body de la petición no es JSON válido' }
  }
}

// ─── Tipos inferidos ─────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type ProductInput = z.infer<typeof productSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
