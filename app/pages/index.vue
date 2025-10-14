<script setup lang="ts">
definePageMeta({
  auth: false
})

const route = useRoute()
const router = useRouter()

const page = computed(() => {
  const raw = Number.parseInt(String(route.query.page ?? '1'), 10)
  return Number.isNaN(raw) || raw < 1 ? 1 : raw
})

interface PostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string | null
  createdAt: string
  author: {
    name: string | null
    email: string | null
  } | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const {
  data,
  status,
  error
} = await useAsyncData(
  () => `/public:posts:${page.value}`,
  () =>
    $fetch<{
      posts: PostListItem[]
      pagination: Pagination
    }>('/api/posts', {
      params: { page: page.value }
    }),
  {
    watch: [page]
  }
)

const posts = computed(() => data.value?.posts ?? [])
const pagination = computed(() => data.value?.pagination)

const showPagination = computed(() => {
  const meta = pagination.value
  return Boolean(meta && meta.totalPages > 1)
})

const formatDate = (value: string | null) => {
  if (!value) {
    return '草稿'
  }
  return new Date(value).toLocaleString()
}

const visitPage = (target: number) => {
  const meta = pagination.value
  if (!meta || target < 1 || target > meta.totalPages || target === page.value) {
    return
  }

  const nextQuery = { ...route.query }
  if (target === 1) {
    delete nextQuery.page
  } else {
    nextQuery.page = String(target)
  }

  router.push({
    path: route.path,
    query: nextQuery
  })
}
</script>
<template>
  <section>
    <header class="hero">
      <h1 class="hero__title">技术博客</h1>
      <p class="hero__subtitle">
        记录技术思考与实践，分享开发经验。
      </p>
    </header>

    <div v-if="status === 'pending'" class="posts__loading">
      正在加载文章列表…
    </div>
    <div v-else-if="error" class="posts__empty">
      首页文章加载失败，请稍后重试。
    </div>
    <ul v-else-if="posts.length" class="posts">
      <li v-for="post in posts" :key="post.id" class="posts__item">
        <NuxtLink :to="`/posts/${post.slug}`" class="posts__title">
          {{ post.title }}
        </NuxtLink>
        <p v-if="post.excerpt" class="posts__excerpt">
          {{ post.excerpt }}
        </p>
        <div class="posts__meta">
          <span>
            作者：{{ post.author?.name || post.author?.email || '匿名作者' }}
          </span>
          <span>发布时间：{{ formatDate(post.publishedAt ?? post.createdAt) }}</span>
        </div>
      </li>
    </ul>
    <div v-else class="posts__empty">
      暂无文章，敬请期待。
    </div>

    <div v-if="showPagination" class="pagination">
      <button
        type="button"
        class="pagination__link"
        :disabled="page === 1"
        @click="visitPage(page - 1)"
      >
        上一页
      </button>
      <span>
        第 {{ page }} / {{ pagination?.totalPages }} 页
      </span>
      <button
        type="button"
        class="pagination__link"
        :disabled="pagination && page === pagination.totalPages"
        @click="visitPage(page + 1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 36px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.hero__title {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 12px;
}

.hero__subtitle {
  font-size: 16px;
  color: #52606d;
  line-height: 1.6;
}

.posts {
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.posts__item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.posts__title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
}

.posts__title:hover {
  text-decoration: underline;
}

.posts__excerpt {
  margin: 12px 0;
  color: #4b5563;
  line-height: 1.7;
}

.posts__meta {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  gap: 12px;
}

.posts__loading,
.posts__empty {
  margin-top: 24px;
  text-align: center;
  color: #6b7280;
}

.pagination {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.pagination__link {
  color: #1f2933;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.pagination__link:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.pagination__link:not(:disabled):hover {
  text-decoration: underline;
}
</style>
