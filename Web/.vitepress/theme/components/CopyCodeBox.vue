<script setup>
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import { RefreshCw } from 'lucide-vue-next'

const { theme } = useData()

const sources = computed(() => {
  const config = theme.value.scriptSources || {}
  return [
    { name: '全国可用 Pages托管', url: config.cloudflare || '' },
    { name: 'Github国内加速', url: config.ghfast || '' },
    { name: 'Github源站', url: config.github || '' },
    { name: '中国大陆备案CDN', url: config.edgeone }
  ]
})

const currentIndex = ref(0)
const currentSource = computed(() => sources.value[currentIndex.value])
const code = computed(() => `bash <(curl -sSL ${currentSource.value.url} | bash)`)

const copied = ref(false)
const isRotating = ref(false)

const toggleSource = (e) => {
  e.stopPropagation()
  isRotating.value = true
  currentIndex.value = (currentIndex.value + 1) % sources.value.length
  setTimeout(() => {
    isRotating.value = false
  }, 500)
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}
</script>

<template>
  <div class="terminal-container">
    <div class="terminal-wrapper">
      <div class="terminal-box" @click="copyCode">
        <div class="terminal-header">
          <div class="dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">Ciallo～(∠・ω<)⌒★ - {{ currentSource.name }}</div>
          
          <div class="header-right">
            <div class="status-wrapper">
              <span class="guide-text" :class="{ hide: copied }">点这里更换地址哦 &gt;&gt;</span>
              <span class="copy-tip" :class="{ show: copied }">已复制!</span>
            </div>
            <button class="refresh-btn" @click="toggleSource" :title="`切换源: ${currentSource.name}`">
              <RefreshCw :class="{ rotating: isRotating }" :size="14" />
            </button>
          </div>
        </div>
        <div class="terminal-content">
          <span class="prompt">bash</span>
          <span class="operator">&lt;(</span><span class="command">curl -sSL {{ currentSource.url }} | bash</span><span class="operator">)</span>
        </div>
      </div>
      <div class="footer-tip">点击复制 click to copy</div>
    </div>
  </div>
</template>

<style scoped>
.terminal-container {
  display: flex;
  justify-content: center;
  padding: 20px 24px;
  margin: -20px 0 40px 0;
}

.terminal-wrapper {
  width: 100%;
  max-width: 850px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.terminal-box {
  background-color: #1e1e1e;
  border-radius: 12px;
  padding: 12px 20px;
  width: 100%;
  font-family: "HarmonyOS_Sans_SC_Mono", "HarmonyOS Sans SC Mono", var(--vp-font-family-mono);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.terminal-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
}

.terminal-header {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
  position: relative;
  height: 24px;
}

.dots {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.red { background-color: #ff5f56; }
.yellow { background-color: #ffbd2e; }
.green { background-color: #27c93f; }

.terminal-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #8e8e8e;
  white-space: nowrap;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 24px;
}

.guide-text {
  font-family: "HarmonyOS_Sans_SC", "HarmonyOS Sans SC", var(--vp-font-family-base);
  font-size: 13px;
  color: #888;
  font-style: italic;
  white-space: nowrap;
  animation: float 2s ease-in-out infinite;
  user-select: none;
  transition: opacity 0.3s, transform 0.3s;
}

.guide-text.hide {
  opacity: 0;
  transform: translateX(10px);
  pointer-events: none;
}

@keyframes float {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-4px); }
}

.refresh-btn {
  background: transparent;
  border: none;
  color: #8e8e8e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.rotating {
  animation: rotate 0.5s ease-in-out;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.copy-tip {
  position: absolute;
  right: 0;
  font-size: 13px;
  color: #27c93f;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  font-weight: bold;
  pointer-events: none;
}

.copy-tip.show {
  opacity: 1;
}

.terminal-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.terminal-content::-webkit-scrollbar {
  display: none;
}

.prompt { color: #569cd6; margin-right: 8px; }
.operator { color: #d4d4d4; }
.command { color: #ce9178; }

.footer-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  letter-spacing: 0.5px;
  opacity: 0.8;
}

@media (min-width: 640px) {
  .terminal-content {
    font-size: 16px;
  }
  .terminal-box {
    padding: 18px 26px;
  }
}
</style>
