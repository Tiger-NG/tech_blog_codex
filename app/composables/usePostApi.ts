// 封装文章的增删改 API，方便在多处调用
interface CreatePostPayload {
  title: string
  excerpt?: string | null
  content: unknown
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

// 更新时只需传入增量字段，因此使用 Partial
interface UpdatePostPayload extends Partial<CreatePostPayload> {}

export const usePostApi = () => {
  // 创建文章，默认保存为草稿
  const createPost = async (payload: CreatePostPayload) => {
    return await $fetch('/api/admin/posts', {
      method: 'POST',
      body: payload
    })
  }

  // 根据文章 ID 更新内容或状态
  const updatePost = async (id: string, payload: UpdatePostPayload) => {
    return await $fetch(`/api/admin/posts/${id}`, {
      method: 'PUT',
      body: payload
    })
  }

  // 删除文章，用于后台管理
  const deletePost = async (id: string) => {
    return await $fetch(`/api/admin/posts/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    createPost,
    updatePost,
    deletePost
  }
}
