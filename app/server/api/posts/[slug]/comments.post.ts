import { createError, defineEventHandler, readBody } from 'h3'
import { getRouterParam } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post slug'
    })
  }

  const session = await requireAuth(event)

  const body = await readBody<{ content?: string }>(event)
  const content = body?.content?.trim() ?? ''

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论内容不能为空。'
    })
  }

  if (content.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论内容不能超过 1000 字。'
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
      statusMessage: '文章不存在或未发布。'
    })
  }

  const COOLDOWN_MS = 10_000

  const lastComment = await prisma.comment.findFirst({
    where: {
      authorId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true
    }
  })

  if (lastComment) {
    const elapsed = Date.now() - new Date(lastComment.createdAt).getTime()
    if (elapsed < COOLDOWN_MS) {
      throw createError({
        statusCode: 429,
        statusMessage: `操作过于频繁，请稍后再试（${Math.ceil((COOLDOWN_MS - elapsed) / 1000)} 秒后）。`
      })
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: post.id,
      authorId: session.user.id
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

  return comment
})
