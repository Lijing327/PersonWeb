<template>
  <footer class="footer-container">
    <div class="footer-inner">
      <!-- Main Grid -->
      <div class="footer-grid">
        <!-- Brand -->
        <div>
          <div class="footer-brand-logo">
            <SiteBrandLogo variant="wordmark" />
          </div>
          <div class="footer-brand-tagline">AI Product Studio</div>
          <p class="footer-brand-desc">
            构建 AI 应用、数字产品与长期数字资产。<br>
            把想法变成可上线、可使用、可迭代的成果。
          </p>
          <div class="footer-social-links">
            <a href="https://github.com/Lijing327" target="_blank" class="footer-social-btn" title="GitHub">
              <i class="fab fa-github"></i>
            </a>
            <button class="footer-social-btn" title="邮箱" @click="showEmailModal = true">
              <i class="fas fa-envelope"></i>
            </button>
            <button class="footer-social-btn" title="微信" @click="showWeChatQR = true">
              <i class="fab fa-weixin"></i>
            </button>
          </div>
        </div>

        <!-- Products -->
        <div>
          <div class="footer-nav-title">产品</div>
          <ul class="footer-nav-list">
            <li><NuxtLink to="/products" class="footer-nav-link">全部产品</NuxtLink></li>
            <li><NuxtLink to="/tools" class="footer-nav-link">工具插件</NuxtLink></li>
            <li><NuxtLink to="/module-store" class="footer-nav-link">模块商店</NuxtLink></li>
          </ul>
        </div>

        <!-- Content -->
        <div>
          <div class="footer-nav-title">内容</div>
          <ul class="footer-nav-list">
            <li><NuxtLink to="/projects" class="footer-nav-link">案例</NuxtLink></li>
            <li><NuxtLink to="/lab" class="footer-nav-link">AI实验室</NuxtLink></li>
            <li><NuxtLink to="/blog" class="footer-nav-link">文章</NuxtLink></li>
          </ul>
        </div>

        <!-- About -->
        <div>
          <div class="footer-nav-title">关于</div>
          <ul class="footer-nav-list">
            <li><NuxtLink to="/about" class="footer-nav-link">关于我</NuxtLink></li>
            <li><NuxtLink to="/contact" class="footer-nav-link">联系合作</NuxtLink></li>
            <li><NuxtLink to="/changelog" class="footer-nav-link">更新日志</NuxtLink></li>
          </ul>
        </div>
      </div>

      <!-- Bottom -->
      <div class="footer-bottom">
        <span class="footer-copyright">© 2026 溪午听风</span>
        <a href="https://beian.miit.gov.cn" target="_blank" class="footer-icp">
          豫ICP备XXXXXXXX号
        </a>
      </div>
    </div>

    <!-- WeChat QR Modal -->
    <div v-if="showWeChatQR" class="wechat-qr-modal" @click="showWeChatQR = false">
      <div class="wechat-qr-content" @click.stop>
        <button class="wechat-qr-close" @click="showWeChatQR = false">✕</button>
        <div style="text-align:center">
          <img src="/images/wechat-qr.png" alt="微信二维码"
            style="width:180px;height:180px;border-radius:12px;margin:0 auto 12px;display:block" />
          <p class="footer-copyright">扫码加好友，请注明来意</p>
        </div>
      </div>
    </div>

    <!-- Email Modal -->
    <div v-if="showEmailModal" class="email-modal" @click="showEmailModal = false">
      <div class="email-modal-content" @click.stop>
        <button class="email-modal-close" @click="showEmailModal = false">✕</button>
        <p class="footer-nav-title" style="margin-bottom:8px">联系邮箱</p>
        <p style="font-size:15px;color:var(--color-text);font-family:var(--font-family-mono)">
          linxiwanting@gmail.com
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'

const showWeChatQR = ref(false)
const showEmailModal = ref(false)
</script>
