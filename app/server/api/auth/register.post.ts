import { defineEventHandler, readBody, createError } from 'h3'
import { hash } from 'bcryptjs'
import { getPrismaClient } from '~/server/utils/prisma'
import { z } from 'zod'

const prisma = getPrismaClient()

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(50, 'Name must be 50 characters or fewer.')
      .optional(),
    email: z
      .string({
        required_error: 'Email is required.'
      })
      .trim()
      .email('Invalid email address.')
      .max(191, 'Email is too long.'),
    password: z
      .string({
        required_error: 'Password is required.'
      })
      .min(8, 'Password must be at least 8 characters.')
      .max(100, 'Password is too long.')
  })
  .transform((data) => ({
    ...data,
    name: data.name && data.name.length > 0 ? data.name : null
  }))

// 提供基础的邮箱+密码注册能力
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid request payload.'
    })
  }

  const email = parsed.data.email.toLowerCase()
  const password = parsed.data.password
  const name = parsed.data.name

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already registered.'
    })
  }

  const hashedPassword = await hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: 'USER'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  return {
    user
  }
})
