<script setup lang="ts">
import { computed, ref } from 'vue'

type ContactType = 'wechat' | 'phone' | 'email'

definePageMeta({
  layout: 'default'
})

const api = useApi()

const form = ref({
  customerName: '',
  contactType: 'wechat' as ContactType,
  contactValue: '',
  budgetRange: '',
  requirementDescription: ''
})

const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const contactPlaceholder = computed(() => {
  if (form.value.contactType === 'phone') return '请输入手机号'
  if (form.value.contactType === 'email') return '请输入邮箱'
  return '请输入微信号'
})

const submitConsultation = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.value.customerName) return (errorMsg.value = '请填写称呼')
  if (!form.value.contactValue) return (errorMsg.value = '请填写联系方式')
  if (!form.value.requirementDescription) return (errorMsg.value = '请填写需求描述')

  const payload: {
    productId: number
    customerName: string
    customerPhone?: string
    customerWeChat?: string
    customerEmail?: string
    budgetRange?: string
    requirementDescription: string
  } = {
    productId: 0,
    customerName: form.value.customerName,
    budgetRange: form.value.budgetRange || undefined,
    requirementDescription: `[来源: 联系合作页]\n${form.value.requirementDescription}`
  }

  if (form.value.contactType === 'phone') payload.customerPhone = form.value.contactValue
  if (form.value.contactType === 'wechat') payload.customerWeChat = form.value.contactValue
  if (form.value.contactType === 'email') payload.customerEmail = form.value.contactValue

  submitting.value = true
  try {
    await api.post('/Consultations', payload)
    successMsg.value = '提交成功，我会尽快联系你。'
    form.value = {
      customerName: '',
      contactType: 'wechat',
      contactValue: '',
      budgetRange: '',
      requirementDescription: ''
    }
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || '提交失败，请稍后再试'
  } finally {
    submitting.value = false
  }
}

usePageSeo({
  title: '联系合作 - 溪午听风',
  description: '合作咨询入口：描述目标、预算与交付期望，按项目方式对齐方案与节奏。',
  path: '/contact',
  world: 'work',
})
</script>

<template>
  <section class="contact-page">
    <div class="contact-shell">
      <div class="contact-intro">
        <p class="contact-kicker">Work With Me</p>
        <h1>联系合作</h1>
        <p class="contact-desc">
          这里是独立的合作入口。你可以直接描述目标、预算范围和期望交付，我会按项目方式与你对齐方案与节奏。
        </p>
        <div class="contact-chips">
          <span>AI 应用落地</span>
          <span>业务系统开发</span>
          <span>自动化工具产品化</span>
        </div>
      </div>

      <form class="contact-form" @submit.prevent="submitConsultation">
        <h2>快速提交需求</h2>
        <div class="contact-grid">
          <input v-model.trim="form.customerName" type="text" placeholder="称呼" />
          <select v-model="form.contactType">
            <option value="wechat">微信</option>
            <option value="phone">电话</option>
            <option value="email">邮箱</option>
          </select>
          <input v-model.trim="form.contactValue" type="text" :placeholder="contactPlaceholder" />
          <input v-model.trim="form.budgetRange" type="text" placeholder="预算范围（可选）" />
        </div>
        <textarea v-model.trim="form.requirementDescription" rows="5" placeholder="请描述你的目标、当前问题和预期交付..." />

        <p v-if="errorMsg" class="msg msg-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="msg msg-success">{{ successMsg }}</p>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交咨询' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact-page {
  min-height: calc(100svh - 120px);
  padding: clamp(110px, 12vh, 140px) 0 40px;
  background:
    radial-gradient(circle at 12% 0%, rgb(56 189 248 / 14%), transparent 40%),
    radial-gradient(circle at 86% 100%, rgb(59 130 246 / 16%), transparent 46%),
    #07173b;
}

.contact-shell {
  width: min(var(--space-container), calc(100% - 2.2rem));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 1rem;
}

.contact-intro,
.contact-form {
  border: 1px solid rgb(148 163 184 / 24%);
  border-radius: 1rem;
  background: linear-gradient(165deg, rgb(20 33 63 / 94%), rgb(20 33 63 / 62%));
  padding: 1rem;
}

.contact-kicker {
  margin: 0;
  color: #9fd6ff;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 0.5rem 0 0;
  font-size: clamp(2rem, 4.8vw, 3.1rem);
  color: #f8fbff;
}

.contact-desc {
  margin: 0.8rem 0 0;
  color: #d4ddf2;
  line-height: 1.75;
}

.contact-chips {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.contact-chips span {
  border: 1px solid rgb(148 163 184 / 28%);
  border-radius: 999px;
  padding: 0.34rem 0.72rem;
  color: #dbeafe;
  font-size: 0.84rem;
}

.contact-form h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #f3f8ff;
}

.contact-grid {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid rgb(148 163 184 / 30%);
  border-radius: 0.7rem;
  background: rgb(15 23 42 / 40%);
  color: #eef2ff;
  padding: 0.62rem 0.72rem;
}

textarea {
  margin-top: 0.6rem;
  resize: vertical;
}

.msg {
  margin: 0.58rem 0 0;
}

.msg-error {
  color: #fecaca;
}

.msg-success {
  color: #86efac;
}

.submit-btn {
  margin-top: 0.72rem;
  min-height: 2.7rem;
  padding: 0.62rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgb(96 165 250 / 56%);
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #f8fbff;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .contact-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>

