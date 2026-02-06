import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "PVE-Tools",
  description: "让每个人都能体验虚拟化技术带来的便利。",
  head: [
    ['script', { 
      async: '', 
      defer: '', 
      src: 'https://cloud.umami.is/script.js', 
      'data-website-id': '12730785-6093-4463-b8db-569799c6d79c' 
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
      message: '基于 Cloudflare Pages 托管 | 使用 Umami 收集匿名信息',
      copyright: 'Copyright © 2024-present Maple'
    }
  }
})
