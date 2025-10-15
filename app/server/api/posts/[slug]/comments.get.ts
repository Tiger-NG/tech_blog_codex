import { createError, defineEventHandler } from 'h3'
import { getRouterParam } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post slug'
    })
  }

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
