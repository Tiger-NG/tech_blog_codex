export default defineNuxtRouteMiddleware(async (to) => {
  console.log('[middleware/admin-only] invoked', to.fullPath)
  // 非 /admin 路径直接放行
  if (!to.path.startsWith('/admin')) {
    console.log('[middleware/admin-only] bypass for non-admin route')
    return
  }

  const auth = useAuth()
  const { status, data } = auth
  console.log('[middleware/admin-only] initial status', status.value)

  // 等待会话状态稳定，避免在加载阶段错误重定向
  if (status.value === 'loading') {
    console.log('[middleware/admin-only] status loading, trying to fetch session')
    if (typeof auth.fetchSession === 'function') {
      console.log('[middleware/admin-only] calling fetchSession')
      await auth.fetchSession()
    } else if (typeof auth.getSession === 'function') {
      console.log('[middleware/admin-only] calling getSession')
      await auth.getSession()
    }
    console.log('[middleware/admin-only] status after session fetch', status.value)
  }

  // 未登录用户重定向到登录页
  if (status.value !== 'authenticated') {
    console.log('[middleware/admin-only] unauthenticated, redirect to /login')
    return navigateTo('/login')
  }

  // 非管理员用户禁止访问后台
  if (data.value?.user?.role !== 'ADMIN') {
    console.log('[middleware/admin-only] non-admin user, redirect to /')
    return navigateTo('/')
  }

  console.log('[middleware/admin-only] admin access granted')
})
