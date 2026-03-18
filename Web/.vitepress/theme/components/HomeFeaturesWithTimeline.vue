<script setup>
import { useData } from 'vitepress'
import todoData from '../../../todo-data.json'

const { frontmatter } = useData()
</script>

<template>
  <div v-if="frontmatter.my_features" class="home-content-container">
    <div class="features-wrapper">
      <div class="features-grid">
        <div v-for="feature in frontmatter.my_features" :key="feature.title" class="feature-card">
          <div class="feature-icon" :class="feature.iconClass"></div>
          <h2 class="feature-title">{{ feature.title }}</h2>
          <p class="feature-details">{{ feature.details }}</p>
        </div>
      </div>
    </div>
    
    <div class="timeline-wrapper">
      <div class="timeline-box">
        <div class="timeline-header">
          <h2 class="timeline-box-title">更新时间线</h2>
          <a href="/todo" class="timeline-more">更多计划 &gt;</a>
        </div>
        <div class="timeline-list">
          <div v-for="(event, index) in todoData.timeline.slice(0, 5)" :key="index" class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">{{ event.date }}</div>
              <div class="timeline-event">{{ event.event }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-content-container {
  display: flex;
  flex-direction: row;
  gap: 32px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px;
}

.features-wrapper {
  flex: 2;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.feature-card {
  background-color: var(--vp-c-bg-soft);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  height: 100%;
}

.feature-card:hover {
  border-color: var(--vp-c-brand);
}

/* 这里的图标样式尽量向 VitePress 官方靠拢，并配合 custom.css */
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: var(--vp-c-default-soft);
  transition: all 0.25s;
  color: var(--custom-icon-color);
}

.feature-card:hover .feature-icon {
  color: var(--vp-c-brand);
}

.feature-icon::before {
  content: '';
  width: 24px;
  height: 24px;
  background-color: currentColor;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

/* 图标映射 - 这里的类名需要在 index.md 中指定 */
.icon-rocket::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:rocket-launch-outline.svg');
  mask-image: url('https://api.iconify.design/mdi:rocket-launch-outline.svg'); 
}
.icon-sparkles::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:sparkles.svg');
  mask-image: url('https://api.iconify.design/mdi:sparkles.svg'); 
}
.icon-harddrive::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:harddisk.svg');
  mask-image: url('https://api.iconify.design/mdi:harddisk.svg'); 
}
.icon-gpu::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:video-card.svg');
  mask-image: url('https://api.iconify.design/mdi:video-card.svg'); 
}
.icon-clock::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:clock-outline.svg');
  mask-image: url('https://api.iconify.design/mdi:clock-outline.svg'); 
}
.icon-more::before { 
  -webkit-mask-image: url('https://api.iconify.design/mdi:dots-horizontal.svg');
  mask-image: url('https://api.iconify.design/mdi:dots-horizontal.svg'); 
}

.feature-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
  background: none;
  -webkit-text-fill-color: initial;
}

.feature-details {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Timeline side */
.timeline-wrapper {
  flex: 1;
}

.timeline-box {
  background-color: var(--vp-c-bg-soft);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-bg-soft);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.timeline-box-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  background: none;
  -webkit-text-fill-color: initial;
}

.timeline-more {
  font-size: 0.8rem;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 500;
}

.timeline-more:hover {
  opacity: 0.8;
}

.timeline-list {
  position: relative;
  padding-left: 16px;
  border-left: 1px solid var(--vp-c-divider);
  margin-left: 8px;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -21px;
  top: 6px;
  width: 9px;
  height: 9px;
  background-color: var(--vp-c-brand);
  border-radius: 50%;
  border: 2px solid var(--vp-c-bg-soft);
}

.timeline-date {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-brand);
  margin-bottom: 4px;
}

.timeline-event {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 960px) {
  .home-content-container {
    flex-direction: column;
    padding: 24px;
  }
  
  .timeline-box {
    position: static;
  }
}
</style>
