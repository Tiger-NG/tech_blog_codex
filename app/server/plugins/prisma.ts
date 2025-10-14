import { defineNitroPlugin } from '#imports'
import { getPrismaClient } from '~/server/utils/prisma'

// 启动 Nitro 时挂载 Prisma 客户端，并在进程关闭后释放连接
export default defineNitroPlugin((nitroApp) => {
  const prisma = getPrismaClient()

  nitroApp.hooks.hook('close', async () => {
    await prisma.$disconnect()
  })
})
