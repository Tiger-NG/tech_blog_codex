import { defineAdminEventHandler } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()

export default defineAdminEventHandler(async (_event, _session) => {
  // 提供后台首页使用的概览数据
  const [users, posts, comments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count()
  ])

  return {
    users,
    posts,
    comments
  }
})
