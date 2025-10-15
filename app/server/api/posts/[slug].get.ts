import { defineEventHandler, createError } from 'h3'
import { getRouterParam } from 'h3'
import { z } from 'zod'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()

const slugSchema = z.object({
  slug: z
    .string({
      required_error: 'Missing post slug'
    })
    .trim()
    .min(1, 'Missing post slug')
    .max(191, 'Invalid post slug')
})

export default defineEventHandler(async (event) => {
  // 文章详情通过 slug 查询
  const result = slugSchema.safeParse({
    slug: getRouterParam(event, 'slug')
  })

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post slug'
    })
  }

  const { slug } = result.data

  const post = await prisma.post.findUnique({
    where: {
      slug,
      status: 'PUBLISHED'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
          email: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found'
    })
  }

  return post
})
