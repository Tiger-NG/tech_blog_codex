import { defineEventHandler, getQuery } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()
// 公开列表页每页展示数量
const PAGE_SIZE = 10

export default defineEventHandler(async (event) => {
  // 读取页码，未传时默认第 1 页
  const { page = '1' } = getQuery(event)
  const pageNumber = Number.parseInt(Array.isArray(page) ? page[0] : page, 10) || 1
  const skip = (pageNumber - 1) * PAGE_SIZE

  // 并发获取总数和分页数据
  const [total, posts] = await Promise.all([
    prisma.post.count({
      where: { status: 'PUBLISHED' }
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            email: true
          }
        }
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
