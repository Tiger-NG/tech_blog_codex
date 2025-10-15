<script setup lang="ts">
// 未登录用户才能访问登录页，已登录则自动跳回首页
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/'
  }
})

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const { signIn } = useAuth()
const router = useRouter()

const handleSubmit = async () => {
  // 重置状态，避免旧错误一直展示
  errorMessage.value = null
  isSubmitting.value = true

  try {
    const result = await signIn('credentials', {
      redirect: false,
      email: email.value,
      password: password.value
    })

    if (result?.error) {
      errorMessage.value = result.error
      return
    }

    // 登录成功后回到首页
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后再试。'
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  router.push('/')
}
</script>

<template>
  <section class="auth auth--login">
    <div class="auth__overlay" aria-hidden="true"></div>
    <div class="auth__dialog">
      <button type="button" class="auth__dialog-close" aria-label="关闭登录弹窗" @click="handleClose">
        ×
      </button>
      <div class="auth__brand">
        <span class="auth__brand-badge">Tech Blog</span>
        <h1 class="auth__title">欢迎回来</h1>
        <p class="auth__subtitle">
          使用个人凭据登录，继续你的技术旅程。
        </p>
      </div>

      <div class="auth__card">
        <form class="auth__form" @submit.prevent="handleSubmit">
          <label class="auth__label">
            邮箱
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="auth__input"
            >
          </label>

          <label class="auth__label">
            密码
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              autocomplete="current-password"
              class="auth__input"
            >
          </label>

          <p v-if="errorMessage" class="auth__error">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="auth__button"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '登录中…' : '登录' }}
          </button>
        </form>

        <p class="auth__footer">
          还没有账号？
          <NuxtLink to="/register">立即注册</NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(20px, 5vw, 56px) clamp(16px, 4vw, 32px);
  z-index: 1000;
}

.auth__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.auth__dialog {
  position: relative;
  width: min(100% - clamp(32px, 8vw, 120px), 880px);
  margin-inline: auto;
  display: grid;
  gap: clamp(24px, 5vw, 40px);
  background: rgba(15, 23, 42, 0.92);
  border-radius: 20px;
  padding: clamp(28px, 5vw, 48px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32);
  color: #e2e8f0;
  z-index: 1;
  align-items: center;
}

.auth__dialog-close {
  position: absolute;
  top: clamp(10px, 3vw, 18px);
  right: clamp(10px, 3vw, 18px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(226, 232, 240, 0.25);
  background: rgba(15, 23, 42, 0.78);
  color: rgba(226, 232, 240, 0.92);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.auth__dialog-close:hover {
  background: rgba(148, 163, 184, 0.26);
  transform: scale(1.06);
}

.auth__brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth__brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.3);
  background: rgba(226, 232, 240, 0.06);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth__title {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 700;
  margin: 0;
}

.auth__subtitle {
  font-size: clamp(14px, 2vw, 16px);
  color: rgba(226, 232, 240, 0.78);
  margin: 0;
  line-height: 1.7;
}

.auth__card {
  position: relative;
  backdrop-filter: blur(12px);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.16);
  border-radius: 16px;
  padding: clamp(24px, 4vw, 32px);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth__close {
  position: absolute;
  top: clamp(8px, 2vw, 14px);
  right: clamp(8px, 2vw, 14px);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(226, 232, 240, 0.25);
  background: rgba(15, 23, 42, 0.75);
  color: rgba(226, 232, 240, 0.9);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.auth__close:hover {
  background: rgba(148, 163, 184, 0.2);
  transform: scale(1.05);
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth__label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.85);
}

.auth__input {
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.auth__input:focus {
  border-color: rgba(94, 234, 212, 0.7);
  background: rgba(15, 23, 42, 0.85);
  outline: none;
  box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.15);
}

.auth__error {
  color: #fca5a5;
  font-size: 13px;
  text-align: center;
}

.auth__button {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  color: #0b1120;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.auth__button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.35);
}

.auth__button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth__footer {
  text-align: center;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.7);
}

.auth__footer a {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}

.auth__footer a:hover {
  text-decoration: underline;
}

@media (min-width: 860px) {
  .auth__dialog {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .auth__card {
    align-self: center;
  }
}

@media (max-width: 640px) {
  .auth__dialog {
    width: min(100% - 24px, 600px);
  }

  .auth__brand {
    align-items: flex-start;
  }
}
</style>
