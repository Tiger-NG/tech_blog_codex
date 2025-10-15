import { createError, defineEventHandler } from 'h3'
import { getRouterParam } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'
import { z } from 'zod'

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
      id: true
    }
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found'
    })
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      isVisible: true,
      parentId: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  return comments
})
