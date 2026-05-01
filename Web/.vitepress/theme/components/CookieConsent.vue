<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'pve-tools-cookie-consent'
const showBanner = ref(false)
const isVisible = ref(false)

onMounted(() => {
  const consent = localStorage.getItem(STORAGE_KEY)
  if (!consent) {
    setTimeout(() => {
      showBanner.value = true
      setTimeout(() => {
        isVisible.value = true
      }, 50)
    }, 800)
  } else if (consent === 'accepted') {
    loadUmami()
  }
})

const loadUmami = () => {
  if (document.querySelector('script[data-umami]')) return
  
  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.src = 'https://cloud.umami.is/script.js'
  script.setAttribute('data-website-id', '20d9b612-ee9c-4e5e-9183-1abd4e401629')
  script.setAttribute('data-umami', 'true')
  document.head.appendChild(script)
}

const accept = () => {
  localStorage.setItem(STORAGE_KEY, 'accepted')
  loadUmami()
  closeBanner()
}

const decline = () => {
  localStorage.setItem(STORAGE_KEY, 'declined')
  closeBanner()
}

const closeBanner = () => {
  isVisible.value = false
  setTimeout(() => {
    showBanner.value = false
  }, 300)
}
</script>

<template>
  <Transition name="cookie-banner">
    <div v-if="showBanner" class="cookie-consent" :class="{ visible: isVisible }">
      <div class="cookie-header">
        <span class="cookie-icon">🍪</span>
        <span class="cookie-title">Cookie 使用说明</span>
      </div>
      <div class="cookie-content">
        <p class="cookie-text">
          我们使用匿名分析工具 (Umami) 来了解页面的访问情况，帮助我们改进文档质量。
          不收集任何个人身份信息，数据仅用于统计分析。
        </p>
        <div class="cookie-actions">
          <button class="btn btn-decline" @click="decline">拒绝</button>
          <button class="btn btn-accept" @click="accept">接受</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-consent {
  position: fixed;
  bottom: 20px;
  left: 20px;
  max-width: 360px;
  background: rgba(var(--vp-c-bg-rgb), 0.95);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 999;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.cookie-consent.visible {
  opacity: 1;
  transform: translateY(0);
}

.dark .cookie-consent {
  background: rgba(30, 30, 32, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.cookie-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cookie-icon {
  font-size: 18px;
}

.cookie-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.cookie-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.cookie-text {
  margin-bottom: 14px;
}

.cookie-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-decline {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.btn-decline:hover {
  background: var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.btn-accept {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.btn-accept:hover {
  background: var(--vp-c-brand-2);
}

.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 640px) {
  .cookie-consent {
    left: 10px;
    right: 10px;
    bottom: 10px;
    max-width: none;
  }
}
</style>
