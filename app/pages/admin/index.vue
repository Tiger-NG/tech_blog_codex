<script setup lang="ts">
definePageMeta({
  auth: {
    required: true,
    roles: ['ADMIN']
  }
})

const { data: authData } = useAuth()

const displayName = computed(() => authData.value?.user?.name || authData.value?.user?.email || '管理员')

const {
  data: statsData,
  status,
  error,
  refresh
} = await useAsyncData('admin-dashboard-stats', () =>
  $fetch<{
    users: number
    posts: number
    comments: number
  }>('/api/admin/stats')
)

const stats = computed(() => statsData.value ?? { users: 0, posts: 0, comments: 0 })

const quickLinks = [
  {
    title: '文章管理',
    description: '发布、编辑、删除文章，支持草稿与发布状态切换。',
    link: '/admin/posts',
    cta: '进入文章管理',
    disabled: false
  },
  {
    title: '分类与标签',
    description: '规划主题标签，帮助读者快速找到内容。（开发中）',
    link: '#',
    cta: '敬请期待',
    disabled: true
  },
  {
    title: '评论互动',
    description: '审核评论、维护社区环境。（开发中）',
    link: '#',
    cta: '敬请期待',
    disabled: true
  }
]

const handleRefresh = async () => {
  await refresh()
}

const handleQuickLink = async (link: string) => {
  try {
    console.log('[admin/index] navigating to', link)
    await navigateTo(link)
  } catch (error) {
    console.error('[admin/index] navigation failed', error)
  }
}
</script>

<template>
  <section class="admin">
    <header>
      <h1 class="admin__title">管理后台</h1>
      <p class="admin__subtitle">
        欢迎回来，{{ displayName }}。在这里你可以管理文章、标签与评论。
      </p>
    </header>

    <section class="admin__stats">
      <div class="admin__stats-header">
        <h2>站点概览</h2>
        <button type="button" class="admin__refresh" :disabled="status === 'pending'" @click="handleRefresh">
          刷新数据
        </button>
      </div>
      <div v-if="status === 'pending'" class="admin__stats-loading">
        正在拉取概览数据…
      </div>
      <div v-else-if="error" class="admin__stats-error">
        概览数据加载失败，请稍后重试。
      </div>
      <div v-else class="admin__stats-grid">
        <div class="admin__stat-card">
          <span class="admin__stat-label">注册用户</span>
          <strong class="admin__stat-value">{{ stats.users }}</strong>
        </div>
        <div class="admin__stat-card">
          <span class="admin__stat-label">文章总数</span>
          <strong class="admin__stat-value">{{ stats.posts }}</strong>
        </div>
        <div class="admin__stat-card">
          <span class="admin__stat-label">评论总数</span>
          <strong class="admin__stat-value">{{ stats.comments }}</strong>
        </div>
      </div>
    </section>

    <section class="admin__grid">
      <article v-for="item in quickLinks" :key="item.title" class="admin__card">
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
        <button
          v-if="!item.disabled"
          type="button"
          class="admin__link"
          @click="handleQuickLink(item.link)"
        >
          {{ item.cta }}
        </button>
        <span v-else class="admin__link admin__link--disabled">
          {{ item.cta }}
        </span>
      </article>
    </section>
  </section>
</template>

<style scoped>
.admin {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 36px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.admin__title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.admin__subtitle {
  font-size: 16px;
  color: #52606d;
  line-height: 1.6;
}

.admin__stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin__stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin__refresh {
  appearance: none;
  border: 1px solid #d4d4d8;
  background: #f4f4f5;
  color: #1f2933;
  padding: 6px 16px;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 14px;
}

.admin__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin__stats-loading,
.admin__stats-error {
  padding: 16px;
  border-radius: 8px;
  background-color: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
}

.admin__stats-error {
  background-color: #fef2f2;
  color: #b91c1c;
}

.admin__stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.admin__stat-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin__stat-label {
  font-size: 13px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin__stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.admin__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.admin__card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin__card h2 {
  font-size: 18px;
  font-weight: 600;
}

.admin__card p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.admin__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1f2933;
  font-size: 14px;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-weight: 600;
}

.admin__link:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

.admin__link--disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.admin__link:not(.admin__link--disabled):hover {
  text-decoration: underline;
}
</style>
