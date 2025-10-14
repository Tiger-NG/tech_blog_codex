import { readBody, createError } from 'h3'
import { getRouterParam } from 'h3'
import { defineAdminEventHandler } from '~/server/utils/auth'
import { getPrismaClient } from '~/server/utils/prisma'
import { slugify } from '~/utils/slugify'

const prisma = getPrismaClient()

// 更新时也需要确保 slug 唯一，排除当前文章自身
const ensureUniqueSlug = async (id: string, title: string) => {
  const baseSlug = slugify(title) || `post-${Date.now().toString(36)}`

  let slug = baseSlug
  let suffix = 1

  while (
    await prisma.post.findFirst({
      where: {
        slug,
        NOT: { id }
      },
      select: { id: true }
    })
  ) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return slug
}

export default defineAdminEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing post id'
    })
  }

  const body = await readBody<{
    title?: string
    excerpt?: string | null
    content?: unknown
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing body'
    })
  }

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, status: true, publishedAt: true, title: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found'
    })
  }

  const updateData: Record<string, unknown> = {}

  if (typeof body.title === 'string') {
    updateData.title = body.title
    updateData.slug = await ensureUniqueSlug(id, body.title)
  }

  if ('excerpt' in body) {
    updateData.excerpt = body.excerpt ?? null
  }

  if (body.content) {
    updateData.content = body.content as object
  }

  if (body.status) {
    updateData.status = body.status
    if (body.status === 'PUBLISHED' && !existing.publishedAt) {
      updateData.publishedAt = new Date()
    } else if (body.status !== 'PUBLISHED') {
      updateData.publishedAt = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No updates provided.'
    })
  }

  const updated = await prisma.post.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true
    }
  })

  return updated
})
