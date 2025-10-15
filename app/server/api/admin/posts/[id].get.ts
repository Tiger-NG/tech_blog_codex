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

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
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
