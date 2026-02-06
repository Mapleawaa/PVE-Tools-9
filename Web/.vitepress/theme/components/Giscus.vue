<script setup>
import { useData } from 'vitepress'
import { watch } from 'vue'

const { isDark } = useData()

// 监听主题变化，动态更新 giscus 主题
watch(isDark, (newVal) => {
  const theme = newVal ? 'dark' : 'light'
  const iframe = document.querySelector('iframe.giscus-frame')
  if (!iframe) return
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme } } },
    'https://giscus.app'
  )
})
</script>

<template>
  <div class="giscus-container">
    <component
      :is="'script'"
      src="https://giscus.app/client.js"
      data-repo="Mapleawaa/PVE-Tools-9"
      data-repo-id="R_kgDOM74h_A" 
      data-category="Announcements"
      data-category-id="DIC_kwDOM74h_M4CjSjG"
      data-mapping="pathname"
      data-strict="0"
      data-reactions-enabled="1"
      data-emit-metadata="0"
      data-input-position="top"
      :data-theme="isDark ? 'dark' : 'light'"
      data-lang="zh-CN"
      data-loading="lazy"
      crossorigin="anonymous"
      async
    />
  </div>
</template>

<style scoped>
.giscus-container {
  margin-top: 48px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 24px;
}
</style>
