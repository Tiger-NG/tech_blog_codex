// 统一管理与鉴权相关的 API 调用，便于在页面中复用
interface RegisterPayload {
  name?: string
  email: string
  password: string
}

interface RegisterResponse {
  user: {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
  }
}

export const useAuthApi = () => {
  // 调用后端注册接口，返回新创建的用户信息
  const register = async (payload: RegisterPayload) => {
    return await $fetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: payload
    })
  }

  return {
    register
  }
}
