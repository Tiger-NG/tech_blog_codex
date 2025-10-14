import { getQuery } from 'h3'
import { defineAdminEventHandler } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()
// 后台列表每页显示更多条目，便于批量管理
const PAGE_SIZE = 20

export default defineAdminEventHandler(async (event) => {
  const { page = '1' } = getQuery(event)
  const pageNumber = Number.parseInt(Array.isArray(page) ? page[0] : page, 10) || 1
  const skip = (pageNumber - 1) * PAGE_SIZE

  const [total, posts] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true
      },
      skip,
      take: PAGE_SIZE
    })
  ])

  return {
    posts,
    pagination: {
      page: pageNumber,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE)
    }
  }
})
