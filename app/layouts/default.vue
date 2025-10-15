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
      <div class="layout__background" aria-hidden="true"></div>
      <div class="shell layout__shell">
        <nav class="layout__nav">
          <NuxtLink to="/" class="layout__brand">
            <span class="layout__logo">⚡</span>
            <span class="layout__brand-text">Tech Blog</span>
          </NuxtLink>
          <div class="layout__links">
            <NuxtLink to="/" class="layout__nav-link">
              首页
            </NuxtLink>
            <NuxtLink v-if="status === 'authenticated' && isAdmin" to="/admin" class="layout__nav-link">
              管理后台
            </NuxtLink>
            <template v-if="status === 'authenticated'">
              <span class="layout__user-pill">
                {{ displayName }}
              </span>
              <button type="button" class="layout__nav-link layout__nav-link--button" @click="handleSignOut">
                退出
              </button>
            </template>
            <template v-else>
              <NuxtLink to="/login" class="layout__nav-link">
                登录
              </NuxtLink>
              <NuxtLink to="/register" class="layout__nav-link layout__nav-link--primary">
                注册
              </NuxtLink>
            </template>
          </div>
        </nav>
      </div>
    </header>
    <main class="layout__main">
      <div class="shell layout__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
:global(:root) {
  --shell-max-width: 1280px;
  --shell-padding: 40px;
}

@media (max-width: 1440px) {
  :global(:root) {
    --shell-max-width: 1100px;
    --shell-padding: 32px;
  }
}

@media (max-width: 1024px) {
  :global(:root) {
    --shell-max-width: 880px;
    --shell-padding: 28px;
  }
}

@media (max-width: 768px) {
  :global(:root) {
    --shell-max-width: 640px;
    --shell-padding: 20px;
  }
}

@media (max-width: 576px) {
  :global(:root) {
    --shell-max-width: 100%;
    --shell-padding: 16px;
  }
}

:global(.shell) {
  width: min(100%, var(--shell-max-width));
  margin-inline: auto;
  padding-inline: var(--shell-padding);
}

:global(.layout__header .shell) {
  padding-inline: clamp(16px, 3vw, 32px);
}

:global(body) {
  background-color: #f2f4f8;
  margin: 0;
  padding: 0;
}

.layout {
  min-height: 100vh;
  background-color: #f2f4f8;
  color: #1f2933;
  display: flex;
  flex-direction: column;
}


.layout__header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: transparent;
  margin-bottom: clamp(24px, 5vw, 40px);
}

.layout__background {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.layout__shell {
  position: relative;
  padding-block: clamp(14px, 3vw, 20px);
}

.layout__nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(16px, 4vw, 28px);
}

.layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: clamp(18px, 2.4vw, 22px);
  text-decoration: none;
  color: #f9fafb;
}

.layout__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  color: #0b1120;
  font-size: 18px;
  font-weight: 600;
}

.layout__links {
  display: inline-flex;
  align-items: center;
  gap: clamp(10px, 3vw, 16px);
}

.layout__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.85);
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  border: 1px solid transparent;
}

.layout__nav-link:hover {
  background: rgba(148, 163, 184, 0.2);
  color: #f8fafc;
}

.layout__nav-link--primary {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  color: #0b1120;
  font-weight: 600;
}

.layout__nav-link--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(14, 165, 233, 0.35);
}

.layout__nav-link--button {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.24);
}

.layout__nav-link--button:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.layout__user-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 13px;
  background: rgba(226, 232, 240, 0.12);
  color: rgba(226, 232, 240, 0.85);
}

.layout__main {
  flex: 1;
  /* padding-block: clamp(28px, 6vw, 64px) clamp(48px, 7vw, 96px); */
  padding-block: 0 clamp(48px, 7vw, 96px);
}

.layout__content {
  display: flex;
  flex-direction: column;
  gap: clamp(24px, 4vw, 40px);
}

@media (max-width: 900px) {
  .layout__nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .layout__links {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
  }
}
</style>
