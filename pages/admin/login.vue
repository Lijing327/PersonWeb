<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">后台管理系统登录</h2>
      <p class="text-sm text-gray-500 text-center -mt-4 mb-6">
        仅校验密码，需与项目根目录 <code class="text-xs">.env</code> 中的 <code class="text-xs">ADMIN_PASSWORD</code> 一致
      </p>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input 
            v-model="username"
            type="text" 
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input 
            v-model="password"
            type="password" 
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="密码"
          />
        </div>
        
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
        
        <button 
          type="submit"
          class="w-full bg-blue-600 text-var(--color-bg-light, white) py-2 rounded-md hover:bg-blue-700 transition"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: false
})

useHead({
  meta: [
    { key: 'robots', name: 'robots', content: 'noindex,nofollow' },
  ],
})

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const { setBackendToken, clearBackendToken } = useBackendAuth()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const trimmedPassword = password.value.trim()
    // Cookie auth via Nitro + backend JWT for .NET API
    const result = await $fetch<{ backendToken?: string }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: {
        username: username.value.trim(),
        password: trimmedPassword,
      },
    })

    if (process.client) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      clearBackendToken()
      if (result?.backendToken) {
        setBackendToken(result.backendToken)
      }
    }

    router.push('/admin')
  } catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status
    if (status === 503) {
      error.value = '后台认证未配置：请在项目根目录 .env 设置 ADMIN_PASSWORD 后重启 npm run dev'
    } else if (status === 401) {
      error.value = '密码错误，请重试'
    } else {
      error.value = e?.statusMessage || e?.message || '登录失败，请检查用户名或密码'
    }
  } finally {
    loading.value = false
  }
}
</script>
