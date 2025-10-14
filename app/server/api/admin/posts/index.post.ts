import { readBody, createError } from 'h3'
import { defineAdminEventHandler } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'
import { slugify } from '~/utils/slugify'

const prisma = getPrismaClient()

// 根据标题生成唯一 slug，避免与历史文章冲突
const generateUniqueSlug = async (title: string) => {
  const baseSlug = slugify(title) || `post-${Date.now().toString(36)}`

  let slug = baseSlug
  let suffix = 1

  while (await prisma.post.findUnique({ where: { slug } })) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return slug
}

export default defineAdminEventHandler(async (event, session) => {
  const body = await readBody<{
    title?: string
    excerpt?: string | null
    content?: unknown
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }>(event)

  // 校验必填内容
  if (!body?.title || !body.content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title and content are required.'
    })
  }

  const slug = await generateUniqueSlug(body.title)
  const status = body.status ?? 'DRAFT'

  // 创建文章并记录作者
  const post = await prisma.post.create({
    data: {
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content: body.content as object,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      authorId: session.user.id
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true
    }
  })

  return post
})
