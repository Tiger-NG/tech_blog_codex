import { createError } from 'h3'
import { getRouterParam } from 'h3'
import { defineAdminEventHandler } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()

export default defineAdminEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post id'
    })
  }

  // 直接删除文章记录，对应评论会因外键设定自动处理
  await prisma.post.delete({
    where: { id }
  })

  return { success: true }
})
