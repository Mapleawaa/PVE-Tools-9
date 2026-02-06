<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dismissed = ref(true) // 默认隐藏，防止闪烁

onMounted(() => {
  const isDismissed = localStorage.getItem('pve-tools-announcement-dismissed')
  if (!isDismissed) {
    // 延迟显示，模拟 Windows 通知弹出感
    setTimeout(() => {
      dismissed.value = false
    }, 1000)
  }
})

const dismiss = () => {
  localStorage.setItem('pve-tools-announcement-dismissed', 'true')
  dismissed.value = true
}
</script>

<template>
  <Transition name="toast">
    <div v-if="!dismissed" class="announcement-toast">
      <div class="toast-header">
        <div class="title-group">
          <span class="icon">⚠️</span>
          <span class="title">系统公告</span>
        </div>
        <button class="close-btn" @click="dismiss" title="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="toast-body">
        <p class="message">
          由于域名 u3u.icu 托管在 Cloudflare 且为新注册，部分地区访问可能较慢。
        </p>
        <p class="highlight">
          我们正在优化中，备案站点预计未来上线，敬请期待！
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.announcement-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: rgba(var(--vp-c-bg-rgb), 0.85);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  overflow: hidden;
}

.dark .announcement-toast {
  background: rgba(30, 30, 32, 0.85);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 16px;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: 0.5px;
}

.close-btn {
  color: var(--vp-c-text-2);
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
}

.close-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.toast-body {
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.message {
  margin-bottom: 8px;
}

.highlight {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* Windows 11 弹出动画效果 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.6, -0.28, 0.74, 0.05);
}

.toast-enter-from {
  transform: translateX(100%) scale(0.9);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .announcement-toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
