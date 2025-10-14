import Prisma from '@prisma/client'
import { useRuntimeConfig } from '#imports'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: Prisma.PrismaClient
}

// 获取或创建全局唯一的 PrismaClient 实例，避免开发模式下重复连接数据库
export const getPrismaClient = () => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  let databaseUrl: string | undefined
  try {
    const runtimeConfig = useRuntimeConfig()
    databaseUrl = runtimeConfig.databaseUrl
  } catch {
    databaseUrl = process.env.DATABASE_URL
  }

  if (!databaseUrl) {
    throw new Error('Missing database connection string. Set `runtimeConfig.databaseUrl` or `DATABASE_URL` env.')
  }

  const prisma = new Prisma.PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  })

  globalForPrisma.prisma = prisma

  return prisma
}
