<script setup lang="ts">
import { createError } from 'h3'

definePageMeta({
  auth: false
})

const route = useRoute()

// 文章 slug 来自动态路由参数
const slug = computed(() => String(route.params.slug))

// 根据 slug 获取文章详情，同时支持服务端渲染
const { data, error } = await useAsyncData(
  () => `/posts:detail:${slug.value}`,
  () =>
    $fetch<{
      id: string
      title: string
      slug: string
      excerpt: string | null
      content: any
      publishedAt: string | null
      createdAt: string
      author: { name: string | null; email: string | null }
      tags: Array<{ tag: { id: number; name: string; slug: string } }>
    }>(`/api/posts/${slug.value}`),
  {
    watch: [slug]
  }
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? '文章加载失败'
  })
}

const post = computed(() => data.value)

const { status: authStatus } = useAuth()

interface PostComment {
  id: string
  content: string
  createdAt: string
  author: { name: string | null; email: string | null } | null
}

const {
  data: commentsData,
  status: commentsStatus,
  refresh: refreshComments
} = await useAsyncData(
  () => `/posts:comments:${slug.value}`,
  () =>
    $fetch<PostComment[]>(`/api/posts/${slug.value}/comments`),
  {
    watch: [slug]
  }
)

const comments = computed(() => commentsData.value ?? [])

const commentForm = reactive({
  content: ''
})

const isCommentSubmitting = ref(false)
const commentMessage = ref<string | null>(null)

const isAuthenticated = computed(() => authStatus.value === 'authenticated')
const isAuthLoading = computed(() => authStatus.value === 'loading')

// TipTap 文档为 JSON，需要先进行转义再渲染
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const allowedTextAlign = new Set(['left', 'center', 'right', 'justify'])

const resolveAlign = (value?: string): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return allowedTextAlign.has(value) ? value : ''
}

const sanitizeLink = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return trimmed
  }
  try {
    const url = new URL(trimmed)
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return url.toString()
    }
  } catch {
    return null
  }
  return null
}

const sanitizeImageSrc = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('/')) {
    return trimmed
  }
  try {
    const url = new URL(trimmed)
    if (['http:', 'https:'].includes(url.protocol)) {
      return url.toString()
    }
  } catch {
    return null
  }
  return null
}

const formatAlignAttr = (value?: string) => {
  const align = resolveAlign(value)
  if (!align || align === 'left') {
    return ''
  }
  return ` style="text-align:${align};"`
}

const buildCellAttributes = (attrs: Record<string, unknown> = {}) => {
  const parts: string[] = []
  const align = resolveAlign(String(attrs.textAlign ?? ''))
  if (align) {
    parts.push(` style="text-align:${align};"`)
  }
  const colspan = Number(attrs.colspan ?? 0)
  if (Number.isInteger(colspan) && colspan > 1) {
    parts.push(` colspan="${colspan}"`)
  }
  const rowspan = Number(attrs.rowspan ?? 0)
  if (Number.isInteger(rowspan) && rowspan > 1) {
    parts.push(` rowspan="${rowspan}"`)
  }
  return parts.join('')
}

// 按照 TipTap mark 定义包裹文本，实现粗体、斜体等效果
const renderMarks = (
  text: string,
  marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
) => {
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
      case 'strong':
        return `<strong>${acc}</strong>`
      case 'italic':
        return `<em>${acc}</em>`
      case 'code':
        return `<code>${acc}</code>`
      case 'strike':
        return `<s>${acc}</s>`
      case 'underline':
        return `<u>${acc}</u>`
      case 'link': {
        const href = sanitizeLink(String(mark.attrs?.href ?? ''))
        if (!href) {
          return acc
        }
        const target =
          typeof mark.attrs?.target === 'string'
            ? mark.attrs.target
            : href.startsWith('http')
              ? '_blank'
              : undefined
        const targetAttr = target ? ` target="${escapeAttribute(target)}"` : ''
        const relAttr = target === '_blank' ? ' rel="noopener noreferrer"' : ''
        const title =
          typeof mark.attrs?.title === 'string' && mark.attrs.title.trim()
            ? ` title="${escapeAttribute(mark.attrs.title)}"`
            : ''
        return `<a href="${escapeAttribute(href)}"${targetAttr}${relAttr}${title}>${acc}</a>`
      }
      case 'textStyle': {
        const color = mark.attrs?.color
        if (typeof color === 'string' && color.trim()) {
          return `<span style="color:${escapeAttribute(color)}">${acc}</span>`
        }
        return acc
      }
      default:
        return acc
    }
  }, text)
}

// 递归渲染节点列表，生成可插入 HTML 的字符串
const renderNodes = (nodes: any): string => {
  if (!nodes) {
    return ''
  }
  const list = Array.isArray(nodes) ? nodes : [nodes]

  return list
    .map((node) => {
      if (!node) {
        return ''
      }
      switch (node.type) {
        case 'paragraph':
          return `<p${formatAlignAttr(node.attrs?.textAlign)}>${renderNodes(node.content)}</p>`
        case 'heading': {
          const level = Math.min(Math.max(node.attrs?.level ?? 1, 1), 6)
          return `<h${level}${formatAlignAttr(node.attrs?.textAlign)}>${renderNodes(node.content)}</h${level}>`
        }
        case 'bulletList':
          return `<ul>${renderNodes(node.content)}</ul>`
        case 'orderedList':
          return `<ol>${renderNodes(node.content)}</ol>`
        case 'listItem':
          return `<li>${renderNodes(node.content)}</li>`
        case 'blockquote':
          return `<blockquote>${renderNodes(node.content)}</blockquote>`
        case 'codeBlock': {
          const code = Array.isArray(node.content)
            ? node.content.map((child: any) => escapeHtml(child?.text ?? '')).join('')
            : escapeHtml(node.content?.text ?? '')
          return `<pre><code>${code}</code></pre>`
        }
        case 'horizontalRule':
          return '<hr />'
        case 'hardBreak':
          return '<br />'
        case 'image': {
          const src = sanitizeImageSrc(String(node.attrs?.src ?? ''))
          if (!src) {
            return ''
          }
          const alt =
            typeof node.attrs?.alt === 'string' && node.attrs.alt
              ? escapeAttribute(node.attrs.alt)
              : ''
          const title =
            typeof node.attrs?.title === 'string' && node.attrs.title
              ? ` title="${escapeAttribute(node.attrs.title)}"`
              : ''
          return `<figure class="post__figure"><img src="${escapeAttribute(src)}" alt="${alt}"${title}></figure>`
        }
        case 'table': {
          const rows = Array.isArray(node.content) ? node.content : []
          const headerRows = rows.filter(
            (row: any) =>
              Array.isArray(row?.content) && row.content.some((cell: any) => cell?.type === 'tableHeader')
          )
          const bodyRows = headerRows.length ? rows.filter((row: any) => !headerRows.includes(row)) : rows
          const headHtml = headerRows.length
            ? `<thead>${headerRows.map((row: any) => renderNodes(row)).join('')}</thead>`
            : ''
          const bodyHtml = `<tbody>${bodyRows.map((row: any) => renderNodes(row)).join('')}</tbody>`
          return `<div class="post__table-wrapper"><table>${headHtml}${bodyHtml}</table></div>`
        }
        case 'tableRow':
          return `<tr>${renderNodes(node.content)}</tr>`
        case 'tableHeader':
          return `<th${buildCellAttributes(node.attrs)}>${renderNodes(node.content)}</th>`
        case 'tableCell':
          return `<td${buildCellAttributes(node.attrs)}>${renderNodes(node.content)}</td>`
        case 'text': {
          const text = escapeHtml(node.text ?? '')
          return renderMarks(text, node.marks)
        }
        default:
          return renderNodes(node.content)
      }
    })
    .join('')
}

// 将 TipTap JSON 转换成最终展示的 HTML
const contentHtml = computed(() => {
  if (!post.value?.content) {
    return ''
  }
  return renderNodes(post.value.content.content ?? post.value.content)
})

const handleCommentSubmit = async () => {
  if (!isAuthenticated.value) {
    commentMessage.value = '请先登录后再发表评论。'
    return
  }

  const content = commentForm.content.trim()

  if (!content) {
    commentMessage.value = '评论内容不能为空。'
    return
  }

  if (content.length > 1000) {
    commentMessage.value = '评论内容不能超过 1000 字。'
    return
  }

  isCommentSubmitting.value = true
  commentMessage.value = null

  try {
    await $fetch(`/api/posts/${slug.value}/comments`, {
      method: 'POST',
      body: { content }
    })
    commentForm.content = ''
    await refreshComments()
    commentMessage.value = '评论已发布。'
  } catch (error) {
    if (error && typeof error === 'object' && 'data' in error && error.data) {
      const data = (error as { data?: { statusMessage?: string } }).data
      commentMessage.value =
        (data?.statusMessage && data.statusMessage.trim()) || '发表评论失败，请稍后再试。'
    } else if (error instanceof Error) {
      commentMessage.value = error.message
    } else {
      commentMessage.value = '发表评论失败，请稍后再试。'
    }
  } finally {
    isCommentSubmitting.value = false
  }
}

// 发布或创建时间的友好展示
const formatDate = (value?: string | null) => {
  if (!value) {
    return '未发布'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <section class="article" v-if="post">
    <nav class="article__nav" aria-label="页面导航">
      <NuxtLink to="/" class="article__nav-link">
        ← 返回首页
      </NuxtLink>
    </nav>
    <article class="article__container">
      <header class="article__header">
        <p class="article__eyebrow">Tech Blog · Insight</p>
        <h1 class="article__title">
          {{ post.title }}
        </h1>
        <div class="article__meta">
          <span class="article__pill">
            作者 · {{ post.author.name || post.author.email || '匿名' }}
          </span>
          <span class="article__pill article__pill--accent">
            发布于 · {{ formatDate(post.publishedAt ?? post.createdAt) }}
          </span>
        </div>
        <p v-if="post.excerpt" class="article__excerpt">
          {{ post.excerpt }}
        </p>
        <ul v-if="post.tags.length" class="article__tags">
          <li v-for="tag in post.tags" :key="tag.tag.id" class="article__tag">
            #{{ tag.tag.name }}
          </li>
        </ul>
        <div class="article__divider" aria-hidden="true"></div>
      </header>
      <div class="article__content" v-html="contentHtml" />
    </article>
  </section>
  <section class="comments" v-if="post">
    <h2 class="comments__title">
      评论
      <span class="comments__count">({{ comments.length }})</span>
    </h2>
    <div v-if="commentsStatus === 'pending'" class="comments__loading">
      正在加载评论……
    </div>
    <template v-else>
      <div class="comments__form-wrapper">
        <div v-if="isAuthenticated" class="comments__form">
          <textarea
            v-model="commentForm.content"
            class="comments__input"
            rows="4"
            maxlength="1000"
            placeholder="写下你的想法，最多 1000 字。"
            :disabled="isCommentSubmitting"
          />
          <div class="comments__controls">
            <button
              type="button"
              class="comments__submit"
              :disabled="isCommentSubmitting"
              @click="handleCommentSubmit"
            >
              {{ isCommentSubmitting ? '提交中…' : '发表评论' }}
            </button>
          </div>
        </div>
        <div v-else-if="isAuthLoading" class="comments__signin">
          正在检测登录状态…
        </div>
        <div v-else class="comments__signin">
          请
          <NuxtLink to="/login">登录</NuxtLink>
          后发表评论。
        </div>
      </div>
      <p v-if="commentMessage" class="comments__message">
        {{ commentMessage }}
      </p>
      <ul v-if="comments.length" class="comments__list">
        <li v-for="comment in comments" :key="comment.id" class="comments__item">
          <div class="comments__meta">
            <span class="comments__author">
              {{ comment.author?.name || comment.author?.email || '匿名用户' }}
            </span>
            <span class="comments__time">
              {{ formatDate(comment.createdAt) }}
            </span>
          </div>
          <p class="comments__content">
            {{ comment.content }}
          </p>
        </li>
      </ul>
      <div v-else class="comments__empty">
        还没有评论，抢先发表你的想法吧。
      </div>
    </template>
  </section>
</template>

<style scoped>
.article {
  display: flex;
  flex-direction: column;
  gap: clamp(20px, 5vw, 40px);
}

.article__nav {
  width: min(100%, 720px);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #0369a1;
  text-decoration: none;
  padding: 6px 0;
}

.article__nav-link:hover {
  text-decoration: underline;
}

.article__container {
  background: #ffffff;
  border-radius: 14px;
  padding: clamp(22px, 5vw, 40px);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  width: min(100%, 720px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 4vw, 28px);
}

.article__header {
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 3vw, 22px);
}

.article__eyebrow {
  font-size: clamp(11px, 1.8vw, 12px);
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: rgba(100, 116, 139, 0.9);
}

.article__title {
  font-size: clamp(28px, 4.2vw, 40px);
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
  color: #0f172a;
}

.article__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.article__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(226, 232, 240, 0.6);
  color: #1e293b;
}

.article__pill--accent {
  background: rgba(56, 189, 248, 0.25);
  color: #0f172a;
}

.article__excerpt {
  font-size: clamp(15px, 2.2vw, 18px);
  line-height: 1.7;
  color: #475569;
  margin: 0;
}

.article__tags {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article__tag {
  font-size: 12px;
  color: #2563eb;
}

.article__divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.8), rgba(148, 163, 184, 0));
}

.article__content {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2933;
}

.article__content :global(p) {
  margin: 16px 0;
}

.article__content :global(h2),
.article__content :global(h3),
.article__content :global(h4) {
  margin: 28px 0 16px;
  font-weight: 600;
  color: #0f172a;
}

.article__content :global(a) {
  color: #2563eb;
  text-decoration: underline;
}

.article__content :global(ul),
.article__content :global(ol) {
  margin: 16px 0 16px 24px;
  line-height: 1.7;
}

.article__content :global(blockquote) {
  border-left: 3px solid #cbd5f5;
  padding-left: 16px;
  margin: 16px 0;
  color: #4c51bf;
  font-style: italic;
}

.article__content :global(pre) {
  background-color: #0f172a;
  color: #e5e7eb;
  padding: 18px;
  border-radius: 10px;
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
}

.article__content :global(code) {
  font-family: 'Fira Code', monospace;
  background-color: rgba(99, 102, 241, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}

.article__content :global(img) {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  margin: 20px auto;
}

.article__content :global(.post__figure) {
  margin: 24px 0;
  text-align: center;
}

.article__content :global(.post__table-wrapper) {
  width: 100%;
  overflow-x: auto;
  margin: 24px 0;
}

.article__content :global(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background-color: #ffffff;
}

.article__content :global(th),
.article__content :global(td) {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}

.article__content :global(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.comments {
  margin: clamp(28px, 6vw, 40px) auto 0;
  background-color: #ffffff;
  border-radius: 12px;
  padding: clamp(22px, 5vw, 36px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(100%, 720px);
}

.comments__title {
  font-size: clamp(18px, 2.6vw, 22px);
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.comments__count {
  font-size: 14px;
  color: #6b7280;
}

.comments__form-wrapper {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: clamp(14px, 3vw, 18px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments__input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  background-color: #ffffff;
}

.comments__input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.comments__controls {
  display: flex;
  justify-content: flex-end;
}

.comments__submit {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.comments__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments__signin {
  font-size: 14px;
  color: #4b5563;
}

.comments__signin a {
  color: #2563eb;
  text-decoration: underline;
}

.comments__message {
  font-size: 13px;
  color: #4b5563;
}

.comments__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comments__item {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.comments__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comments__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.comments__author {
  font-weight: 600;
  color: #1f2933;
}

.comments__content {
  font-size: 14px;
  color: #1f2933;
  line-height: 1.7;
  white-space: pre-wrap;
}

.comments__empty {
  font-size: 14px;
  color: #6b7280;
}

.comments__loading {
  font-size: 14px;
  color: #6b7280;
}

@media (max-width: 700px) {
  .article__nav,
  .article__container,
  .comments {
    width: min(100% - 24px, 720px);
  }

  .article__meta {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (min-width: 1440px) {
  .article__nav,
  .article__container,
  .comments {
    width: min(100% - 120px, 820px);
  }
}
</style>
