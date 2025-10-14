import { getServerSession } from '#auth'
import { defineEventHandler, createError, type H3Event } from 'h3'
import type { Role } from '@prisma/client'

// 要求请求具备登录态，未登录则抛出 401
export const requireAuth = async (event: H3Event) => {
  const session = await getServerSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return session
}

// 在已有登录态的前提下，进一步校验角色
export const requireRole = async (event: H3Event, role: Role) => {
  const session = await requireAuth(event)

  if (session.user.role !== role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  return session
}

// 包装 Nitro 事件处理器，使其默认具备管理员权限校验
export const defineAdminEventHandler = <T>(
  handler: (event: H3Event, session: Awaited<ReturnType<typeof requireAuth>>) => Promise<T> | T
) =>
  defineEventHandler(async (event: H3Event) => {
    const session = await requireRole(event, 'ADMIN')
    return handler(event, session)
  })
