import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import CopyCodeBox from './components/CopyCodeBox.vue'
import Announcement from './components/Announcement.vue'
import Giscus from './components/Giscus.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-after': () => h(CopyCodeBox),
      'layout-top': () => h(Announcement),
      'doc-after': () => h(Giscus)
    })
  }
}
