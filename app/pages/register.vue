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

const handleClose = () => {
  router.push('/')
}
</script>

<template>
  <section class="auth auth--register">
    <div class="auth__overlay" aria-hidden="true"></div>
    <div class="auth__dialog">
      <button type="button" class="auth__dialog-close" aria-label="关闭注册弹窗" @click="handleClose">
        ×
      </button>
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
            <input v-model="name" type="text" maxlength="40" autocomplete="name" class="auth__input">
          </label>

          <label class="auth__label">
            邮箱
            <input v-model="email" type="email" required autocomplete="email" class="auth__input">
          </label>

          <label class="auth__label">
            密码
            <input v-model="password" type="password" required minlength="8" autocomplete="new-password"
              class="auth__input">
          </label>

          <label class="auth__label">
            确认密码
            <input v-model="confirmPassword" type="password" required minlength="8" autocomplete="new-password"
              class="auth__input">
          </label>

          <p v-if="errorMessage" class="auth__error">
            {{ errorMessage }}
          </p>

          <button type="submit" class="auth__button" :disabled="isSubmitting">
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
</style>