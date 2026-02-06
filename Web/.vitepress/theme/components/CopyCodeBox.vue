<script setup>
import { ref } from 'vue'

const code = "curl -sSL https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh | bash"
const copied = ref(false)

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code)
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
          <div class="terminal-title">Ciallo～(∠・ω<)⌒★</div>
          <span class="copy-tip" :class="{ show: copied }">已复制!</span>
        </div>
        <div class="terminal-content">
          <span class="prompt">bash</span>
          <span class="operator">&lt;(</span><span class="command">curl -sSL https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh | bash</span><span class="operator">)</span>
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
  font-family: var(--vp-font-family-mono);
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

.copy-tip {
  margin-left: auto;
  font-size: 12px;
  color: #27c93f;
  opacity: 0;
  transition: opacity 0.3s;
  font-weight: bold;
}

.copy-tip.show {
  opacity: 1;
}

.terminal-content {
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  padding-bottom: 4px;
}

.terminal-content::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
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
    font-size: 15px;
  }
  .terminal-box {
    padding: 16px 24px;
  }
}
</style>
