import { defineEventHandler, readBody, createError } from 'h3'
import { hash } from 'bcryptjs'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()

// 提供基础的邮箱+密码注册能力
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    password?: string
  }>(event)

  const email = body?.email?.trim().toLowerCase()
  const password = body?.password
  const name = body?.name?.trim() || null

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.'
    })
  }

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
