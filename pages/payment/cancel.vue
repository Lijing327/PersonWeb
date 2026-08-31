<template>
  <div class="payment-cancel">
    <div class="container">
      <div class="cancel-icon">
        <i class="fas fa-times-circle"></i>
      </div>
      <h1>支付已取消</h1>
      <p>您已取消本次支付，订单尚未完成。</p>

      <div class="reasons">
        <h3>可能的原因：</h3>
        <ul>
          <li>您不想继续购买此模块</li>
          <li>支付过程中出现错误</li>
          <li>需要使用其他支付方式</li>
        </ul>
      </div>

      <div class="actions">
        <button @click="retryPayment" class="btn btn-primary">
          <i class="fas fa-redo"></i> 重新支付
        </button>
        <button @click="goToModules" class="btn btn-outline">
          浏览其他模块
        </button>
        <button @click="contactSupport" class="btn btn-secondary">
          <i class="fas fa-headset"></i> 联系客服
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const retryPayment = () => {
  const orderId = route.query.orderId
  if (orderId) {
    router.push(`/payment?orderId=${orderId}`)
  } else {
    router.push('/modules')
  }
}

const goToModules = () => {
  router.push('/modules')
}

const contactSupport = () => {
  window.open('mailto:linxiwanting@gmail.com?subject=支付咨询', '_blank')
}
</script>

<style scoped>
.payment-cancel {
  padding: 2rem 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 2rem;
  background: var(--color-bg-light, white);
  border-radius: 8px;
  box-shadow: 0 2px 10px var(--shadow);
}

.cancel-icon {
  font-size: 4rem;
  color: var(--color-danger);
  margin-bottom: 1rem;
}

h1 {
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

p {
  color: var(--color-gray-500);
  margin-bottom: 2rem;
}

.reasons {
  background: var(--color-bg-elevated);
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  text-align: left;
}

.reasons h3 {
  margin-top: 0;
  color: var(--color-amber-900);
}

.reasons ul {
  color: var(--color-amber-900);
  padding-left: 20px;
}

.reasons li {
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-bg-light, white);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-warning);
  color: var(--color-bg-light, white);
}

.btn-secondary:hover {
  background: var(--color-orange-600);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--color-bg-light, white);
}

i {
  font-size: 1.2rem;
}
</style>
