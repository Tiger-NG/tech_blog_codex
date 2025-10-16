<script setup lang="ts">
// 文章管理页必须由管理员访问
definePageMeta({
  auth: {
    required: true,
    roles: ['ADMIN']
  }
})

const route = useRoute()
// 通过查询参数记录当前页
const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? '1'), 10)
  return Number.isNaN(value) || value < 1 ? 1 : value
})

// 后台列表及分页信息
const { data, status, refresh } = await useAsyncData(
  () => `/admin:posts:${page.value}`,
  () =>
    $fetch<{
      posts: Array<{
        id: string
        title: string
        slug: string
        status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
        createdAt: string
        updatedAt: string
        publishedAt: string | null
      }>
      pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
      }
    }>('/api/admin/posts', {
      params: { page: page.value }
    }),
  {
    watch: [page]
  }
)

const posts = computed(() => data.value?.posts ?? [])
const pagination = computed(() => data.value?.pagination)

const { createPost, updatePost, deletePost } = usePostApi()

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface AdminPostDetail {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: Record<string, unknown> | null
  status: PostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const form = reactive({
  title: '',
  excerpt: '',
  content: null as Record<string, unknown> | null
})

const isSubmitting = ref(false)
const message = ref<string | null>(null)

const editingState = reactive({
  id: null as string | null,
  title: '',
  loading: false as boolean
})

const isEditing = computed(() => editingState.id !== null)
const editingTitle = computed(() => editingState.title)

const resetForm = () => {
  form.title = ''
  form.excerpt = ''
  form.content = null
}

const exitEditing = () => {
  editingState.id = null
  editingState.title = ''
  editingState.loading = false
}

const cancelEdit = () => {
  if (!isEditing.value) {
    return
  }
  exitEditing()
  resetForm()
  message.value = '已取消编辑。'
}

const hasMeaningfulContent = (doc: any): boolean => {
  if (!doc) {
    return false
  }

  const nodes = Array.isArray(doc.content) ? doc.content : []
  return nodes.some((node) => {
    if (!node) {
      return false
    }
    if (node.type === 'text') {
      return typeof node.text === 'string' && node.text.trim().length > 0
    }
    return hasMeaningfulContent(node)
  })
}

const validateForm = (): boolean => {
  if (!form.title) {
    message.value = '标题不能为空。'
    return false
  }

  if (!form.content || !hasMeaningfulContent(form.content)) {
    message.value = '正文不能为空。'
    return false
  }

  return true
}

const createNewPost = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  message.value = null

  try {
    await createPost({
      title: form.title,
      excerpt: form.excerpt || null,
      content: form.content,
      status: 'DRAFT'
    })
    resetForm()
    message.value = '文章已保存为草稿。'
    await refresh()
  } catch (error) {
    message.value = error instanceof Error ? error.message : '创建文章失败，请稍后再试。'
  } finally {
    isSubmitting.value = false
  }
}

const updateExistingPost = async () => {
  if (!isEditing.value || !editingState.id) {
    return
  }

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  message.value = null

  try {
    await updatePost(editingState.id, {
      title: form.title,
      excerpt: form.excerpt || null,
      content: form.content ?? undefined
    })
    message.value = '文章已更新。'
    exitEditing()
    resetForm()
    await refresh()
  } catch (error) {
    message.value = error instanceof Error ? error.message : '更新文章失败，请稍后再试。'
  } finally {
    isSubmitting.value = false
  }
}

const handleSubmit = async () => {
  if (isEditing.value) {
    await updateExistingPost()
  } else {
    await createNewPost()
  }
}

const togglePublish = async (post: (typeof posts.value)[number]) => {
  const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  await updatePost(post.id, { status: nextStatus })
  await refresh()
}

const startEdit = async (post: (typeof posts.value)[number]) => {
  if (editingState.loading) {
    return
  }

  message.value = null
  editingState.loading = true

  try {
    const detail = await $fetch<AdminPostDetail>(`/api/admin/posts/${post.id}`)
    editingState.id = detail.id
    editingState.title = detail.title
    form.title = detail.title
    form.excerpt = detail.excerpt ?? ''
    form.content = (detail.content as Record<string, unknown> | null) ?? null
  } catch (error) {
    message.value = error instanceof Error ? error.message : '加载文章详情失败，请稍后再试。'
    exitEditing()
  } finally {
    editingState.loading = false
  }
}

const handleDelete = async (post: (typeof posts.value)[number]) => {
  if (!confirm(`确定要删除《${post.title}》吗？`)) {
    return
  }
  await deletePost(post.id)
  if (editingState.id === post.id) {
    exitEditing()
    resetForm()
  }
  await refresh()
}

// 统一的日期显示格式
const formatDate = (value: string | null) => {
  if (!value) {
    return '未发布'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <section class="admin-posts">
    <nav class="admin-posts__breadcrumb" aria-label="导航">
      <NuxtLink to="/admin" class="admin-posts__breadcrumb-link">
        ← 返回后台首页
      </NuxtLink>
    </nav>
    <header class="admin-posts__header">
      <h1>文章管理</h1>
      <p>创建新文章或管理现有内容。</p>
    </header>

    <form class="admin-posts__form" @submit.prevent="handleSubmit">
      <h2>{{ isEditing ? '编辑文章' : '新建文章' }}</h2>
      <div v-if="isEditing" class="admin-posts__editing-banner">
        <span>正在编辑：《{{ editingTitle }}》</span>
        <button type="button" class="admin-posts__cancel" :disabled="isSubmitting || editingState.loading"
          @click="cancelEdit">
          取消编辑
        </button>
      </div>

      <label>
        标题
        <input v-model="form.title" type="text" required placeholder="文章标题">
      </label>

      <label>
        摘要
        <textarea v-model="form.excerpt" rows="2" placeholder="选填：文章摘要" />
      </label>

      <label>
        正文
        <ClientOnly>
          <RichTextEditor v-model="form.content" placeholder="撰写文章内容…"
            :editable="!isSubmitting && !editingState.loading" />
        </ClientOnly>
      </label>

      <button type="submit" class="admin-posts__submit" :disabled="isSubmitting || editingState.loading">
        {{ isSubmitting ? '保存中…' : isEditing ? '保存修改' : '保存为草稿' }}
      </button>
      <p v-if="message" class="admin-posts__message">
        {{ message }}
      </p>
    </form>

    <section class="admin-posts__list">
      <header class="admin-posts__list-header">
        <div>
          <h2>文章列表</h2>
          <p class="admin-posts__list-subtitle">
            共 {{ pagination?.total ?? 0 }} 篇内容，快速查看并操作。
          </p>
        </div>
      </header>

      <div v-if="status === 'pending'" class="admin-posts__loading">
        正在加载文章……
      </div>
      <div v-else-if="posts.length === 0" class="admin-posts__empty">
        还没有文章。
      </div>

      <table v-else class="admin-posts__table">
        <thead>
          <tr>
            <th>标题</th>
            <th>状态</th>
            <th>发布时间</th>
            <th class="admin-posts__table-actions-header">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>
              <NuxtLink :to="`/posts/${post.slug}`" target="_blank" class="admin-posts__table-title">
                {{ post.title }}
              </NuxtLink>
            </td>
            <td>
              <span class="admin-posts__table-status" :class="{
                'is-published': post.status === 'PUBLISHED',
                'is-draft': post.status === 'DRAFT',
                'is-archived': post.status === 'ARCHIVED'
              }">
                {{ post.status === 'PUBLISHED' ? '已发布' : post.status === 'DRAFT' ? '草稿' : '归档' }}
              </span>
            </td>
            <td>
              <span class="admin-posts__table-time">
                {{ formatDate(post.publishedAt ?? post.createdAt) }}
              </span>
            </td>
            <td class="admin-posts__table-actions">
              <button type="button" class="admin-posts__action-button"
                :disabled="editingState.loading || (isEditing && editingState.id === post.id)" @click="startEdit(post)">
                编辑
              </button>
              <button type="button" class="admin-posts__action-button" @click="togglePublish(post)">
                {{ post.status === 'PUBLISHED' ? '下线' : '发布' }}
              </button>
              <button type="button" class="admin-posts__action-button admin-posts__action-button--danger"
                @click="handleDelete(post)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <nav v-if="pagination" class="pagination admin-posts__pagination">
        <NuxtLink v-if="pagination.page > 1" :to="{ query: { page: pagination.page - 1 } }" class="pagination__link">
          上一页
        </NuxtLink>
        <span class="pagination__info">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 页
        </span>
        <NuxtLink v-if="pagination.page < pagination.totalPages" :to="{ query: { page: pagination.page + 1 } }"
          class="pagination__link">
          下一页
        </NuxtLink>
      </nav>
    </section>
  </section>
</template>

<style scoped>
.admin-posts {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.admin-posts__header {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.admin-posts__form {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-posts__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #4b5563;
}

.admin-posts__form input,
.admin-posts__form textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
}

.admin-posts__submit {
  align-self: flex-start;
  background-color: #1f2933;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  cursor: pointer;
}

.admin-posts__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.admin-posts__editing-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #f3f4f6;
  font-size: 13px;
  color: #1f2933;
}

.admin-posts__cancel {
  appearance: none;
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
}

.admin-posts__cancel:hover {
  background-color: rgba(37, 99, 235, 0.08);
}

.admin-posts__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-posts__message {
  color: #2563eb;
  font-size: 13px;
}

.admin-posts__breadcrumb {
  margin-bottom: 0;
}

.admin-posts__breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}

.admin-posts__breadcrumb-link:hover {
  text-decoration: underline;
}


.admin-posts__list {
  background-color: #ffffff;
  border-radius: 12px;
  padding: clamp(22px, 4vw, 32px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 3vw, 26px);
}

.admin-posts__list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: clamp(12px, 3vw, 24px);
}

.admin-posts__list-header h2 {
  margin: 0;
  font-size: clamp(20px, 2.4vw, 24px);
  font-weight: 600;
  color: #0f172a;
}

.admin-posts__list-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.admin-posts__overview-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
}

.admin-posts__overview-link:hover {
  background: rgba(37, 99, 235, 0.18);
}


.admin-posts__table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
  font-size: 14px;
}

.admin-posts__table thead {
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.75), rgba(241, 245, 249, 0.95));
  color: #0f172a;
}

.admin-posts__table th,
.admin-posts__table td {
  padding: 14px;
  text-align: left;
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
}

.admin-posts__table-title {
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
}

.admin-posts__table-title:hover {
  text-decoration: underline;
}

.admin-posts__table-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
  font-size: 12px;
}

.admin-posts__table-status.is-published {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.admin-posts__table-status.is-draft {
  background: rgba(250, 204, 21, 0.15);
  color: #92400e;
}

.admin-posts__table-status.is-archived {
  background: rgba(148, 163, 184, 0.28);
  color: #475569;
}

.admin-posts__table-time {
  color: #64748b;
  font-size: 13px;
}

.admin-posts__table-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-posts__table-actions-header {
  text-align: right;
}

.admin-posts__action-button {
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
  padding: 6px 14px;
  background: rgba(226, 232, 240, 0.4);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.admin-posts__action-button:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.35);
  transform: translateY(-1px);
}

.admin-posts__action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-posts__action-button--danger {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.admin-posts__action-button--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.18);
}

.admin-posts__loading,
.admin-posts__empty {
  text-align: center;
  color: #6b7280;
  padding: 16px 0;
}

.pagination {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: flex-end;
}

.pagination__link {
  color: #1f2933;
  text-decoration: none;
}

.pagination__link:hover {
  text-decoration: underline;
}
</style>
