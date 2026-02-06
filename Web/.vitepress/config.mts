import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "PVE-Tools",
  description: "让每个人都能体验虚拟化技术带来的便利。",
  head: [
    ['link', { rel: 'stylesheet', href: 'https://s1.hdslb.com/bfs/static/jinkela/longtu/images/harmonyos_sans_sc.css' }],
    ['link', { rel: 'stylesheet', href: 'https://s1.hdslb.com/bfs/static/jinkela/longtu/images/harmonyos_sans_sc_mono.css' }],
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
      { text: '公告', link: '/faq#为什么-u3u-icu-域名访问缓慢或失败' },
      { text: '使用指南', link: '/guide' },
      { text: '高级教程', link: '/advanced/' },
      { text: '更新日志', link: '/update' },
      { text: 'GitHub', link: 'https://github.com/Mapleawaa/PVE-Tools-9' }
    ],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '简介', link: '/guide' },
          { text: '功能特性', link: '/features' },
          { text: '更新日志', link: '/update' },
          { text: '常见问题', link: '/faq' }
        ]
      },
      {
        text: '教程',
        items: [
          { text: '教程总览', link: '/advanced/' },
          { text: 'Intel 核显直通', link: '/advanced/gpu-passthrough' },
          { text: '核显虚拟化 SR-IOV', link: '/advanced/gpu-virtualization' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Mapleawaa/PVE-Tools-9' }
    ],
    footer: {
      message: '基于 Cloudflare Pages 托管 | 使用 Umami 收集匿名信息 ',
      copyright: ' | Copyright © 2024 - ∞ Maple'
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
