<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
// 从运行时配置中读取 auth.baseURL，构造真实的 session 接口地址
const sessionUrl = computed(() => {
  const baseURL = runtimeConfig.public.auth?.baseURL ?? '/api/auth'
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
  try {
    return new URL('session', normalizedBaseURL).toString()
  } catch {
    return `${normalizedBaseURL}session`
  }
})

if (process.client) {
  // 在客户端将用户重定向到实际的 Auth.js Session 接口
  navigateTo(sessionUrl.value, {
    external: true,
    redirectCode: 302
  })
}
</script>

<template>
  <div class="session-redirect">
    正在跳转到登录会话页面…
  </div>
</template>

<style scoped>
.session-redirect {
  text-align: center;
  margin-top: 64px;
  color: #4b5563;
}
</style>
