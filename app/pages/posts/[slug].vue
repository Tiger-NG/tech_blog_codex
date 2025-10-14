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

// TipTap 文档为 JSON，需要先进行转义再渲染
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

// 按照 TipTap mark 定义包裹文本，实现粗体、斜体等效果
const renderMarks = (text: string, marks: Array<{ type: string }> = []) => {
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
          return `<p>${renderNodes(node.content)}</p>`
        case 'heading': {
          const level = Math.min(Math.max(node.attrs?.level ?? 1, 1), 6)
          return `<h${level}>${renderNodes(node.content)}</h${level}>`
        }
        case 'bulletList':
          return `<ul>${renderNodes(node.content)}</ul>`
        case 'orderedList':
          return `<ol>${renderNodes(node.content)}</ol>`
        case 'listItem':
          return `<li>${renderNodes(node.content)}</li>`
        case 'blockquote':
          return `<blockquote>${renderNodes(node.content)}</blockquote>`
        case 'codeBlock':
          return `<pre><code>${renderNodes(node.content)}</code></pre>`
        case 'horizontalRule':
          return '<hr />'
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

// 发布或创建时间的友好展示
const formatDate = (value?: string | null) => {
  if (!value) {
    return '未发布'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <article v-if="post" class="post">
    <header class="post__header">
      <h1 class="post__title">
        {{ post.title }}
      </h1>
      <div class="post__meta">
        <span>作者：{{ post.author.name || post.author.email || '匿名' }}</span>
        <span>发布时间：{{ formatDate(post.publishedAt ?? post.createdAt) }}</span>
      </div>
      <p v-if="post.excerpt" class="post__excerpt">
        {{ post.excerpt }}
      </p>
      <ul v-if="post.tags.length" class="post__tags">
        <li v-for="tag in post.tags" :key="tag.tag.id">
          #{{ tag.tag.name }}
        </li>
      </ul>
    </header>
    <div class="post__content" v-html="contentHtml" />
  </article>
</template>

<style scoped>
.post {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 36px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.post__title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.post__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.post__excerpt {
  font-size: 16px;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 20px;
}

.post__tags {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6366f1;
  margin-bottom: 20px;
}

.post__content :global(p) {
  margin: 16px 0;
  line-height: 1.8;
  color: #1f2933;
}

.post__content :global(h2),
.post__content :global(h3),
.post__content :global(h4) {
  margin: 28px 0 16px;
  font-weight: 600;
  color: #111827;
}

.post__content :global(ul),
.post__content :global(ol) {
  margin: 16px 0 16px 24px;
  line-height: 1.7;
}

.post__content :global(blockquote) {
  border-left: 3px solid #cbd5f5;
  padding-left: 16px;
  margin: 16px 0;
  color: #4c51bf;
  font-style: italic;
}

.post__content :global(pre) {
  background-color: #1f2937;
  color: #e5e7eb;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
}

.post__content :global(code) {
  font-family: 'Fira Code', monospace;
  background-color: rgba(99, 102, 241, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>
