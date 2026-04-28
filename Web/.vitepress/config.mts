import { defineConfig } from 'vitepress'

const SITE_URL = 'https://pve.oowo.cc'
const SITE_NAME = 'PVE-Tools-9'
const SITE_DESCRIPTION = 'PVE-Tools-9 是面向 Proxmox VE 9.x 的一键运维脚本，覆盖换源、系统维护、VM 生命周期、宿主机网络、防火墙、IPv6、GPU 与 PCI 直通。'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

function pageToUrl(page: string): string {
  const normalized = page
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')

  if (!normalized) {
    return `${SITE_URL}/`
  }

  return `${SITE_URL}/${normalized}`
}

export default defineConfig({
  lang: 'zh-CN',
  title: SITE_NAME,
  titleTemplate: ':title | PVE-Tools-9',
  description: SITE_DESCRIPTION,
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  sitemap: {
    hostname: SITE_URL,
    lastmodDateOnly: true,
    transformItems: (items) => items.map((item) => {
      const path = item.url.startsWith('http')
        ? new URL(item.url).pathname
        : item.url.startsWith('/')
          ? item.url
          : `/${item.url}`

      return {
        ...item,
        changefreq: path === '/' ? 'weekly' : 'monthly',
        priority: path === '/' ? 1 : path.startsWith('/advanced/') ? 0.7 : 0.8
      }
    })
  },
  srcExclude: ['CLAUDE.md'],
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Maple' }],
    ['meta', { name: 'keywords', content: 'PVE-Tools, PVE-Tools-9, Proxmox VE 9, Proxmox, PVE 运维脚本, 虚拟机管理, GPU 直通, PCI 直通, IPv6, 防火墙' }],
    ['meta', { name: 'robots', content: 'index,follow,max-image-preview:large' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'stylesheet', href: 'https://s1.hdslb.com/bfs/static/jinkela/longtu/images/harmonyos_sans_sc.css' }],
    ['link', { rel: 'stylesheet', href: 'https://s1.hdslb.com/bfs/static/jinkela/longtu/images/harmonyos_sans_sc_mono.css' }],
    ['script', { 
      async: '', 
      defer: '', 
      src: 'https://cloud.umami.is/script.js', 
      'data-website-id': '20d9b612-ee9c-4e5e-9183-1abd4e401629' 
    }]
  ],
  transformHead({ page, title, description }) {
    const url = pageToUrl(page)
    const pageTitle = title || SITE_NAME
    const pageDescription = description || SITE_DESCRIPTION

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: DEFAULT_OG_IMAGE }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: pageDescription }],
      ['meta', { name: 'twitter:image', content: DEFAULT_OG_IMAGE }]
    ]
  },
  themeConfig: {
    logo: {
      light: '/logo-horizontal.svg',
      dark: '/logo-horizontal-dark.svg'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '公告', link: '/update' },
      { text: '使用指南', link: '/guide' },
      { text: '提交插件', link: '/submit-plugin' },
      { text: '高级教程', link: '/advanced/' },
      { text: '更新日志', link: '/update' },
      { text: '开发计划', link: '/todo' },
      { text: 'TOS', link: '/tos' },
      { text: 'ULA', link: '/ula' },
      { text: 'GitHub', link: 'https://github.com/Mapleawaa/PVE-Tools-9' }
    ],
    search: {
      provider: 'local'
    },
    lastUpdated: {
      text: '最后更新'
    },
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '简介', link: '/guide' },
          { text: '功能特性', link: '/features' },
          { text: '提交插件', link: '/submit-plugin' },
          { text: '更新日志', link: '/update' },
          { text: '开发计划', link: '/todo' },
          { text: '服务条款（TOS）', link: '/tos' },
          { text: '最终用户许可（ULA）', link: '/ula' },
          { text: '常见问题', link: '/faq' }
        ]
      },
      {
        text: '高级教程',
        items: [
          { text: '教程总览', link: '/advanced/' },
          { text: 'Intel 核显直通', link: '/advanced/gpu-passthrough' },
          { text: '核显虚拟化 SR-IOV', link: '/advanced/gpu-virtualization' },
          { text: 'CPU 性能调优', link: '/advanced/cpu-optimization' },
          { text: 'PVE 8 升级 9', link: '/advanced/pve-upgrade' },
          { text: '存储管理与休眠', link: '/advanced/storage-management' },
          { text: 'VM 备份/迁移/Cloud-Init', link: '/advanced/vm-backup-migration-cloudinit' },
          { text: '宿主机网络 / 防火墙 / IPv6', link: '/advanced/host-network-firewall-ipv6' },
          { text: '误操作后的数据恢复', link: '/advanced/data-recovery-after-mistake' },
          { text: 'NVIDIA vGPU 驱动说明', link: '/advanced/nvidia-vgpu-driver-notes' }
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
      cloudflare: 'https://pve.oowo.cc/PVE-Tools.sh',
      ghfast: 'https://ghfast.top/raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh',
      github: 'https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh',
      edgeone: '未上线'
    }
  }
})
