<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dismissed = ref(true) // 默认隐藏，防止闪烁
const STORAGE_KEY = 'pve-tools-plugin-submit-banner-dismissed'

onMounted(() => {
  const isDismissed = localStorage.getItem(STORAGE_KEY)
  if (!isDismissed) {
    setTimeout(() => {
      dismissed.value = false
    }, 600)
  }
})

const dismiss = () => {
  localStorage.setItem(STORAGE_KEY, 'true')
  dismissed.value = true
}
</script>

<template>
  <Transition name="toast">
    <div v-if="!dismissed" class="announcement-banner">
      <div class="toast-header">
        <div class="title-group">
          <span class="icon">🧩</span>
          <span class="title">插件提交通道已开启！可以提交自己写的插件啦！</span>
        </div>
        <button class="close-btn" @click="dismiss" title="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="toast-body">
        <p class="message">
          懂 Git 的用户可直接提 PR，不熟悉 Git 的用户可用 Issue 模板提交插件需求或脚本内容。
        </p>
        <a class="banner-link" href="/submit-plugin">点这里查看提交流程细节 →</a>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.announcement-banner {
  position: fixed;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  width: min(92vw, 860px);
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

.dark .announcement-banner {
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

.banner-link {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
}

.banner-link:hover {
  text-decoration: underline;
}

/* Windows 11 弹出动画效果 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.6, -0.28, 0.74, 0.05);
}

.toast-enter-from {
  transform: translate(-50%, -12px) scale(0.98);
  opacity: 0;
}

.toast-leave-to {
  transform: translate(-50%, -12px);
  opacity: 0;
}

@media (max-width: 640px) {
  .announcement-banner {
    top: 68px;
    width: calc(100vw - 20px);
  }
}
</style>
