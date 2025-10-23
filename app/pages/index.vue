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

type ViewMode = 'list' | 'grid'

const view = ref<ViewMode>('list')

const toggleView = (mode: ViewMode) => {
  view.value = mode
}

const { data, status, error } = await useAsyncData(
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
  <section class="home">
    <header class="home__hero">
      <div class="home__hero-glow" aria-hidden="true"></div>
      <div class="home__hero-content">
        <p class="home__eyebrow">Tech Blog · Inspired by GitHub</p>
        <h1 class="home__title">
          构建、分享、持续精进。CI/CD完成了！
        </h1>
        <p class="home__subtitle">
          汇聚现代 Web 技术文章、经验与实践笔记。像维护仓库一样维护知识，与社区一起成长。
        </p>
      </div>
    </header>

    <div id="posts" class="home__content">
      <div class="home__toolbar">
        <h2 class="home__section-title">
          最新内容
        </h2>
        <div class="home__view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            :class="['home__toggle', { 'home__toggle--active': view === 'list' }]"
            :aria-pressed="view === 'list'"
            @click="toggleView('list')"
          >
            列表
          </button>
          <button
            type="button"
            :class="['home__toggle', { 'home__toggle--active': view === 'grid' }]"
            :aria-pressed="view === 'grid'"
            @click="toggleView('grid')"
          >
            卡片
          </button>
        </div>
      </div>
      <div v-if="status === 'pending'" class="home__state">
        正在加载文章列表…
      </div>
      <div v-else-if="error" class="home__state home__state--error">
        首页文章加载失败，请稍后重试。
      </div>
      <div v-else-if="posts.length" :class="['home__posts', `home__posts--${view}`]">
        <article v-for="post in posts" :key="post.id" class="home__post">
          <NuxtLink :to="`/posts/${post.slug}`" class="home__post-title">
            {{ post.title }}
          </NuxtLink>
          <p v-if="post.excerpt" class="home__post-excerpt">
            {{ post.excerpt }}
          </p>
          <div class="home__post-meta">
            <span class="home__pill">
              作者 · {{ post.author?.name || post.author?.email || '匿名作者' }}
            </span>
            <span class="home__pill home__pill--light">
              {{ formatDate(post.publishedAt ?? post.createdAt) }}
            </span>
          </div>
        </article>
      </div>
      <div v-else class="home__state">
        暂无文章，敬请期待。
      </div>
    </div>

    <div v-if="showPagination" class="home__pagination">
      <button
        type="button"
        class="home__page-button"
        :disabled="page === 1"
        @click="visitPage(page - 1)"
      >
        上一页
      </button>
      <span class="home__page-info">
        第 {{ page }} / {{ pagination?.totalPages }} 页
      </span>
      <button
        type="button"
        class="home__page-button"
        :disabled="pagination && page === pagination.totalPages"
        @click="visitPage(page + 1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.home__hero {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: linear-gradient(135deg, #0d1117, #161b22);
  color: #e2e8f0;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
}

.home__hero-glow {
  position: absolute;
  inset: -40% 10% auto 10%;
  height: 60%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 60%);
  filter: blur(60px);
}

.home__hero-content {
  position: relative;
  padding: clamp(28px, 6vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 720px;
  margin-inline: auto;
}

.home__eyebrow {
  font-size: clamp(11px, 1.6vw, 12px);
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: rgba(148, 163, 184, 0.8);
}

.home__title {
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 700;
  margin: 0;
}

.home__subtitle {
  font-size: clamp(14px, 2vw, 18px);
  line-height: 1.7;
  max-width: 560px;
  color: rgba(226, 232, 240, 0.85);
}

.home__content {
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: clamp(20px, 4vw, 32px);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
}

.home__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.home__section-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.home__view-toggle {
  display: inline-flex;
  background: #e2e8f0;
  border-radius: 9999px;
  padding: 4px;
  gap: 4px;
}

.home__toggle {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.home__toggle--active {
  background: #0f172a;
  color: #e2e8f0;
}

.home__state {
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.home__state--error {
  color: #dc2626;
}

.home__posts {
  display: grid;
  gap: 20px;
  margin: 0;
}

.home__posts--list {
  grid-template-columns: 1fr;
}

.home__posts--grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.home__post {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(18px, 3vw, 22px);
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.home__post:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

.home__posts--list .home__post {
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #ffffff;
  box-shadow: none;
  padding: clamp(16px, 3vw, 20px);
}

.home__posts--list .home__post:hover {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.home__post-title {
  font-size: clamp(18px, 2.2vw, 20px);
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
  flex: 1;
}

.home__post-title:hover {
  text-decoration: underline;
}

.home__post-excerpt {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.home__post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.home__posts--list .home__post-meta {
  width: 100%;
  justify-content: space-between;
}

.home__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  background-color: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.home__pill--light {
  background-color: rgba(203, 213, 225, 0.32);
}

.home__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 14px;
}

.home__page-button {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.home__page-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.home__page-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.home__page-info {
  color: #475569;
}

@media (max-width: 640px) {
  .home {
    gap: 24px;
  }

  .home__hero-content {
    padding: clamp(24px, 7vw, 32px);
  }

  .home__toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .home__view-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .home__toggle {
    flex: 1;
    text-align: center;
  }

  .home__content {
    padding: clamp(18px, 6vw, 24px);
  }

  .home__post {
    padding: clamp(14px, 6vw, 18px);
  }

  .home__posts--grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1280px) {
  .home__posts--grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .home__hero {
    border-radius: 20px;
  }
}
</style>
