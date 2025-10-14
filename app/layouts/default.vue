<script setup lang="ts">
import { watch } from '#imports'

const router = useRouter()
const { status, data, signOut } = useAuth()

// 展示优先使用昵称，没有则回退到邮箱
const displayName = computed(() => data.value?.user?.name || data.value?.user?.email || '未命名用户')
// 根据角色控制后台入口显示
const isAdmin = computed(() => data.value?.user?.role === 'ADMIN')

const logPrefix = '[layout/default]'
console.log(`${logPrefix} setup invoked (client=${process.client})`)

const logAuthState = () => {
  console.log(
    `${logPrefix} auth state`,
    JSON.stringify({
      status: status.value,
      user: data.value?.user ?? null
    })
  )
}

if (process.client) {
  logAuthState()
  watch(
    () => ({
      status: status.value,
      userId: data.value?.user?.id,
      role: data.value?.user?.role
    }),
    (newState) => {
      console.log(`${logPrefix} auth watcher`, JSON.stringify(newState))
    },
    { immediate: false, deep: false }
  )
}

// 退出登录后回到首页
const handleSignOut = async () => {
  console.log(`${logPrefix} signOut clicked`)
  await signOut({ redirect: false })
  await router.push('/')
}
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__nav">
        <NuxtLink to="/" class="layout__brand">
          Tech Blog
        </NuxtLink>
        <div class="layout__links">
          <template v-if="status === 'authenticated'">
            <!-- 只有管理员可以看到后台入口 -->
            <NuxtLink v-if="isAdmin" to="/admin" class="layout__link">
              管理后台
            </NuxtLink>
            <span class="layout__welcome">你好，{{ displayName }}</span>
            <button type="button" class="layout__link layout__logout" @click="handleSignOut">
              退出
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="layout__link">
              登录
            </NuxtLink>
            <NuxtLink to="/register" class="layout__link">
              注册
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>
    <main class="layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background-color: #f2f4f8;
  color: #1f2933;
  display: flex;
  flex-direction: column;
}

.layout__header {
  background-color: #ffffff;
  border-bottom: 1px solid #d8dde6;
}

.layout__nav {
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout__brand {
  font-weight: 600;
  font-size: 18px;
  text-decoration: none;
  color: inherit;
}

.layout__links {
  display: flex;
  gap: 12px;
  align-items: center;
}

.layout__link {
  font-size: 14px;
  text-decoration: none;
  color: #52606d;
}

.layout__link:hover {
  color: #1f2933;
}

.layout__welcome {
  font-size: 14px;
  color: #52606d;
}

.layout__logout {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.layout__logout:focus-visible {
  outline: 2px solid #1f2933;
  outline-offset: 2px;
}

.layout__main {
  flex: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px 48px;
}
</style>
