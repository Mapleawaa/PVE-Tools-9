import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "PVE-Tools",
  description: "让每个人都能体验虚拟化技术带来的便利。",
  head: [
    ['script', { 
      async: '', 
      defer: '', 
      src: 'https://cloud.umami.is/script.js', 
      'data-website-id': '20d9b612-ee9c-4e5e-9183-1abd4e401629' 
    }]
  ],
  themeConfig: {
    logo: {
      light: '/logo-horizontal.svg',
      dark: '/logo-horizontal-dark.svg'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '使用指南', link: '/guide' },
      { text: 'GitHub', link: 'https://github.com/Mapleawaa/PVE-Tools-9' }
    ],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '简介', link: '/guide' },
          { text: '功能特性', link: '/features' },
          { text: '常见问题', link: '/faq' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Mapleawaa/PVE-Tools-9' }
    ],
    footer: {
      message: '基于 Cloudflare Pages 托管 | 使用 Umami 收集匿名信息 | ',
      copyright: 'Copyright © 2024-present Maple'
    },
    // 自定义脚本源配置
    scriptSources: {
      cloudflare: 'https://pve.u3u.icu/PVE-Tools.sh',
      ghfast: 'https://ghfast.top/raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh',
      github: 'https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh',
      edgeone: '未上线'
    }
  }
})
