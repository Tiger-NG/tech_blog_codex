import { createError, defineEventHandler, readBody } from 'h3'
import { getRouterParam } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

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

const commentSchema = z.object({
  content: z
    .string({
      required_error: '评论内容不能为空。'
    })
    .trim()
    .min(1, '评论内容不能为空。')
    .max(1000, '评论内容不能超过 1000 字。')
})

export default defineEventHandler(async (event) => {
  const slugResult = slugSchema.safeParse({
    slug: getRouterParam(event, 'slug')
  })

  if (!slugResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post slug'
    })
  }

  const { slug } = slugResult.data
  const session = await requireAuth(event)

  const body = await readBody(event)
  const parsedBody = commentSchema.safeParse(body)
  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedBody.error.issues[0]?.message ?? '评论内容不能为空。'
    })
  }

  const sanitizedContent = sanitizeHtml(parsedBody.data.content, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim()

  if (!sanitizedContent) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论内容不能为空。'
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
      content: sanitizedContent,
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
