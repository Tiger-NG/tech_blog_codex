<script setup lang="ts">
// 注册页同样仅对未登录用户开放
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/'
  }
})

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const router = useRouter()
const { register } = useAuthApi()
const { signIn } = useAuth()

const validatePassword = () => {
  // 基础的长度校验
  if (password.value.length < 8) {
    errorMessage.value = '密码至少需要 8 位字符。'
    return false
  }

  // 确保两次输入一致
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致。'
    return false
  }

  return true
}

const handleSubmit = async () => {
  // 清空上一次的错误提示
  errorMessage.value = null

  if (!validatePassword()) {
    return
  }

  isSubmitting.value = true

  try {
    await register({
      name: name.value,
      email: email.value,
      password: password.value
    })

    const result = await signIn('credentials', {
      redirect: false,
      email: email.value,
      password: password.value
    })

    if (result?.error) {
      errorMessage.value = '注册成功，但自动登录失败，请手动登录。'
      return
    }

    // 自动跳转回首页
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败，请稍后再试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="auth auth--register">
    <div class="auth__background" aria-hidden="true"></div>
    <div class="auth__shell">
      <div class="auth__brand">
        <span class="auth__brand-badge">Tech Blog</span>
        <h1 class="auth__title">创建你的账户</h1>
        <p class="auth__subtitle">
          加入社区，记录你的每一次思考与实践。
        </p>
      </div>

      <div class="auth__card">
        <form class="auth__form" @submit.prevent="handleSubmit">
          <label class="auth__label">
            昵称（可选）
            <input
              v-model="name"
              type="text"
              maxlength="40"
              autocomplete="name"
              class="auth__input"
            >
          </label>

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
              autocomplete="new-password"
              class="auth__input"
            >
          </label>

          <label class="auth__label">
            确认密码
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
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
            {{ isSubmitting ? '注册中…' : '注册' }}
          </button>
        </form>

        <p class="auth__footer">
          已经有账号？
          <NuxtLink to="/login">直接登录</NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth {
  position: relative;
  min-height: calc(100dvh - 80px);
  display: grid;
  place-items: center;
  padding: clamp(20px, 5vw, 56px) 0;
}

.auth__shell {
  position: relative;
  width: min(100%, 880px);
  margin-inline: auto;
  display: grid;
  gap: clamp(24px, 5vw, 40px);
  background: rgba(15, 23, 42, 0.92);
  border-radius: 20px;
  padding: clamp(28px, 5vw, 48px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32);
  color: #e2e8f0;
  overflow: hidden;
  z-index: 1;
  align-items: center;
}

.auth__background {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.28), transparent 55%),
    radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.3), transparent 60%);
  filter: blur(80px);
  opacity: 0.7;
  pointer-events: none;
}

.auth__brand {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1;
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
  z-index: 1;
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
  border-color: rgba(129, 140, 248, 0.7);
  background: rgba(15, 23, 42, 0.85);
  outline: none;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
}

.auth__error {
  color: #fca5a5;
  font-size: 13px;
  text-align: center;
}

.auth__button {
  background: linear-gradient(135deg, #818cf8, #6366f1);
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
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.35);
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
  color: #c7d2fe;
  text-decoration: none;
  font-weight: 600;
}

.auth__footer a:hover {
  text-decoration: underline;
}

@media (min-width: 860px) {
  .auth__shell {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .auth__card {
    align-self: center;
  }
}

@media (max-width: 640px) {
  .auth {
    min-height: 100vh;
  }

  .auth__brand {
    align-items: flex-start;
  }
}
</style>
