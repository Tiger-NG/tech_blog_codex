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
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-card__title">登录</h1>
    <form class="auth-card__form" @submit.prevent="handleSubmit">
      <label class="auth-card__label">
        邮箱
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="auth-card__input"
        >
      </label>

      <label class="auth-card__label">
        密码
        <input
          v-model="password"
          type="password"
          required
          minlength="8"
          autocomplete="current-password"
          class="auth-card__input"
        >
      </label>

      <p v-if="errorMessage" class="auth-card__error">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="auth-card__button"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '登录中…' : '登录' }}
      </button>
    </form>

    <p class="auth-card__footer">
      还没有账号？
      <NuxtLink to="/register">立即注册</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.auth-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 32px;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.auth-card__title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-card__label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #52606d;
  gap: 6px;
}

.auth-card__input {
  padding: 10px 12px;
  border: 1px solid #d8dde6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.auth-card__input:focus {
  border-color: #6366f1;
  outline: none;
}

.auth-card__error {
  color: #dc2626;
  font-size: 13px;
  text-align: center;
}

.auth-card__button {
  background-color: #1f2933;
  color: #ffffff;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.auth-card__button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-card__button:not(:disabled):hover {
  background-color: #111827;
}

.auth-card__footer {
  margin-top: 16px;
  font-size: 13px;
  text-align: center;
  color: #52606d;
}

.auth-card__footer a {
  color: #1f2933;
  text-decoration: underline;
}
</style>
