import { createError, defineEventHandler } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'

// 简单的健康检查接口，用于确认数据库连通性
export default defineEventHandler(async () => {
  const prisma = getPrismaClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  } catch (error) {
    console.error('Database health check failed', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection failed.'
    })
  }
})
