<script setup>
import todoData from '../../../todo-data.json'
</script>

<template>
  <div class="todo-container">
    <section class="todo-section">
      <h2 class="section-title">即将加入的功能</h2>
      <div class="todo-list">
        <div v-for="(item, index) in todoData.upcoming_features" :key="index" class="todo-item">
          <div class="item-header">
            <span class="status-badge" :class="item.status">{{ item.status === 'completed' ? '已完成' : item.status === 'in-progress' ? '开发中' : '计划中' }}</span>
            <h3 class="item-title">{{ item.title }}</h3>
          </div>
          <p class="item-desc">{{ item.description }}</p>
        </div>
      </div>
    </section>

    <section class="todo-section">
      <h2 class="section-title">未来更新时间线</h2>
      <div class="timeline">
        <div v-for="(event, index) in todoData.timeline" :key="index" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-date">{{ event.date }}</div>
            <h3 class="timeline-event">{{ event.event }}</h3>
            <p class="timeline-desc">{{ event.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.todo-container {
  margin-top: 2rem;
}

.todo-section {
  margin-bottom: 3rem;
}

.section-title {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  background: none;
  -webkit-text-fill-color: initial;
}

.todo-list {
  display: grid;
  gap: 1rem;
}

.todo-item {
  background-color: var(--vp-c-bg-soft);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.25s, background-color 0.25s;
}

.todo-item:hover {
  border-color: var(--vp-c-brand);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.item-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background-color: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.status-badge.in-progress {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.status-badge.completed {
  background-color: var(--vp-c-success-soft);
  color: var(--vp-c-success-1);
}

.item-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.timeline {
  position: relative;
  padding-left: 2rem;
  border-left: 2px solid var(--vp-c-divider);
  margin-left: 0.5rem;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-dot {
  position: absolute;
  left: -2.45rem;
  top: 0.25rem;
  width: 0.75rem;
  height: 0.75rem;
  background-color: var(--vp-c-brand);
  border-radius: 50%;
  border: 2px solid var(--vp-c-bg);
}

.timeline-date {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-brand);
  margin-bottom: 0.25rem;
}

.timeline-event {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.timeline-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
</style>
