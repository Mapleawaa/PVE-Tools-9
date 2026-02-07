import { h, nextTick, provide } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import CopyCodeBox from './components/CopyCodeBox.vue'
import Announcement from './components/Announcement.vue'
import Giscus from './components/Giscus.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    const { isDark } = useData()

    provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
      if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        isDark.value = !isDark.value
        return
      }

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        )}px at ${x}px ${y}px)`
      ]

      await document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      }).ready

      document.documentElement.animate(
        { clipPath: isDark.value ? clipPath.reverse() : clipPath },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
        }
      )
    })

    return h(DefaultTheme.Layout, null, {
      'home-hero-after': () => h(CopyCodeBox),
      'layout-top': () => h(Announcement),
      'doc-after': () => h(Giscus)
    })
  }
}
