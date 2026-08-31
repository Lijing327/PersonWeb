<template>
  <footer class="footer-container">
    <div class="footer-inner">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-logo">
            <SiteBrandLogo variant="wordmark" />
          </div>
          <div class="footer-brand-tagline">Work · 专业工作名片</div>
          <p class="footer-brand-desc">
            展示真实案例、可使用的产品，以及公开写作。<br>
            需要合作时，直接联系即可。
          </p>
          <div class="footer-social-links">
            <a
              href="https://github.com/Lijing327"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social-btn"
              aria-label="GitHub（新窗口打开）"
            >
              <i class="fab fa-github" aria-hidden="true"></i>
            </a>
            <button
              type="button"
              class="footer-social-btn"
              aria-label="显示联系邮箱"
              @click="openEmailModal"
            >
              <i class="fas fa-envelope" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="footer-social-btn"
              aria-label="显示微信二维码"
              @click="openWeChatModal"
            >
              <i class="fab fa-weixin" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div v-for="section in footerSections" :key="section.title">
          <div class="footer-nav-title">{{ section.title }}</div>
          <ul class="footer-nav-list">
            <li v-for="item in section.items" :key="item.path">
              <NuxtLink :to="item.path" class="footer-nav-link">{{ item.title }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="footer-copyright">© 2026 溪午听风</span>
        <a :href="SITE_LEGAL.icpQueryUrl" target="_blank" rel="noopener noreferrer" class="footer-icp">
          {{ SITE_LEGAL.icp }}
        </a>
      </div>
    </div>

    <div
      v-if="showWeChatQR"
      class="wechat-qr-modal"
      role="dialog"
      aria-modal="true"
      aria-label="微信二维码"
      @click="closeModals"
      @keydown.esc="closeModals"
    >
      <div class="wechat-qr-content" @click.stop>
        <button type="button" class="wechat-qr-close" aria-label="关闭微信二维码" @click="closeModals">✕</button>
        <div style="text-align:center">
          <img
            src="/images/wechat-qr.png"
            alt="微信二维码"
            width="180"
            height="180"
            decoding="async"
            style="width:180px;height:180px;border-radius:12px;margin:0 auto 12px;display:block"
          />
          <p class="footer-copyright">扫码加好友，请注明来意</p>
        </div>
      </div>
    </div>

    <div
      v-if="showEmailModal"
      class="email-modal"
      role="dialog"
      aria-modal="true"
      aria-label="联系邮箱"
      @click="closeModals"
      @keydown.esc="closeModals"
    >
      <div class="email-modal-content" @click.stop>
        <button type="button" class="email-modal-close" aria-label="关闭邮箱弹层" @click="closeModals">✕</button>
        <p class="footer-nav-title" style="margin-bottom:8px">联系邮箱</p>
        <p style="font-size:15px;color:var(--color-text);font-family:var(--font-family-mono)">
          linxiwanting@gmail.com
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'
import { SITE_LEGAL } from '~/constants/siteLegal'
import { WORK_FOOTER_SECTIONS } from '~/constants/work-ia'

const footerSections = WORK_FOOTER_SECTIONS
const showWeChatQR = ref(false)
const showEmailModal = ref(false)

const openWeChatModal = () => {
  showEmailModal.value = false
  showWeChatQR.value = true
}

const openEmailModal = () => {
  showWeChatQR.value = false
  showEmailModal.value = true
}

const closeModals = () => {
  showWeChatQR.value = false
  showEmailModal.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModals()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
