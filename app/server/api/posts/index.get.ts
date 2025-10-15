import { defineEventHandler, getQuery, createError } from 'h3'
import { z } from 'zod'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()
// 公开列表页每页展示数量
const PAGE_SIZE = 10

const querySchema = z.object({
  page: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform((value) => {
      const parsed = Number.parseInt(value, 10)
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
    })
    .optional()
})

export default defineEventHandler(async (event) => {
  // 读取页码，未传时默认第 1 页
  const rawQuery = getQuery(event)
  const normalizedQuery = {
    page: Array.isArray(rawQuery.page) ? rawQuery.page[0] : rawQuery.page
  }
  const parsed = querySchema.safeParse(normalizedQuery)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters.'
    })
  }

  const pageNumber = parsed.data.page ?? 1
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
