[根目录](../CLAUDE.md) > **Web**

# Web -- VitePress 文档站模块

## 模块职责

为 PVE-Tools-9 项目提供官方文档网站。使用 VitePress 构建，部署于 Cloudflare Pages（域名 `pve.oowo.cc`）。包含使用指南、功能特性、FAQ、更新日志、高级教程、法律条款等内容，同时集成了 Giscus 评论系统和 Umami 分析。

## 入口与启动

| 项目 | 说明 |
|---|---|
| 入口页面 | `Web/index.md`（首页，layout: home） |
| VitePress 配置 | `Web/.vitepress/config.mts` |
| 主题入口 | `Web/.vitepress/theme/index.ts` |
| 依赖管理 | `Web/package.json` + `Web/bun.lock` |
| Cloudflare 配置 | `Web/wrangler.jsonc`（Pages 部署） |
| Workers 入口 | `Web/index.js`（转发到 ASSETS） |

### 启动命令

```bash
cd Web
bun run dev       # 开发模式，默认 http://localhost:5173
bun run build     # 构建到 .vitepress/dist/
bun run preview   # 预览构建结果
```

构建时（`build` 脚本）会自动复制根级 `VERSION`、`UPDATE`、`PVE-Tools.sh` 到 dist 目录。

## 对外接口

### 网站导航结构

**顶部导航栏（nav）**:
- 首页 (`/`) / 公告 (`/faq#...`) / 使用指南 (`/guide`) / 提交插件 (`/submit-plugin`)
- 高级教程 (`/advanced/`) / 更新日志 (`/update`) / 开发计划 (`/todo`)
- TOS (`/tos`) / ULA (`/ula`) / GitHub

**侧边栏（sidebar）**:
- 开始使用: 简介、功能特性、提交插件、更新日志、开发计划、TOS、ULA、FAQ
- 高级教程: 10 篇专题文章（GPU 直通、CPU 调优、PVE 升级、存储、网络、恢复等）

### 页面路由表

| 路由 | 文件 | 说明 |
|---|---|---|
| `/` | `index.md` | 首页，英雄区 + 功能卡片 + 时间线 |
| `/guide` | `guide.md` | 使用指南，高风险功能提醒 |
| `/features` | `features.md` | 功能特性列表 |
| `/faq` | `faq.md` | 常见问题 |
| `/update` | `update.md` | 完整更新日志（v1.x - v7.3.0） |
| `/todo` | `todo.md` | 开发计划（渲染 TodoList 组件） |
| `/sponsor` | `sponsor.md` | 赞助页面 |
| `/pay` | `pay.md` | 付费技术支持 |
| `/tos` | `tos.md` | 服务条款 |
| `/ula` | `ula.md` | 最终用户许可协议 v3.0 |
| `/submit-plugin` | `submit-plugin.md` | 插件提交流程说明 |
| `/advanced/` | `advanced/index.md` | 高级教程总览 |
| `/advanced/cpu-optimization` | `advanced/cpu-optimization.md` | CPU 性能调优 |
| `/advanced/data-recovery-after-mistake` | `advanced/data-recovery-after-mistake.md` | 误操作后数据恢复 |
| `/advanced/gpu-passthrough` | `advanced/gpu-passthrough.md` | Intel 核显直通 |
| `/advanced/gpu-virtualization` | `advanced/gpu-virtualization.md` | 核显虚拟化 SR-IOV |
| `/advanced/host-network-firewall-ipv6` | `advanced/host-network-firewall-ipv6.md` | 宿主机网络/防火墙/IPv6 |
| `/advanced/how-to-connect-ssh` | `advanced/how-to-connect-ssh.md` | 如何连接到 PVE SSH |
| `/advanced/nvidia-vgpu-driver-notes` | `advanced/nvidia-vgpu-driver-notes.md` | NVIDIA vGPU 驱动说明 |
| `/advanced/pve-upgrade` | `advanced/pve-upgrade.md` | PVE 8 升级 9 |
| `/advanced/storage-management` | `advanced/storage-management.md` | 存储管理与休眠 |
| `/advanced/vm-backup-migration-cloudinit` | `advanced/vm-backup-migration-cloudinit.md` | VM 备份/迁移/Cloud-Init |

### 自定义 Vue 组件

| 组件 | 文件 | 功能 |
|---|---|---|
| `Announcement` | `.vitepress/theme/components/Announcement.vue` | 插件提交通道公告横幅（可关闭，localStorage 持久化） |
| `CopyCodeBox` | `.vitepress/theme/components/CopyCodeBox.vue` | 终端风格的一键复制安装命令框，支持切换下载源 |
| `Giscus` | `.vitepress/theme/components/Giscus.vue` | GitHub Discussions 评论系统，随主题切换 dark/light |
| `HomeFeaturesWithTimeline` | `.vitepress/theme/components/HomeFeaturesWithTimeline.vue` | 首页功能卡片 + 更新时间线组件 |
| `TodoList` | `.vitepress/theme/components/TodoList.vue` | 开发计划列表组件，渲染 todo-data.json 数据 |

### 主题扩展 (`.vitepress/theme/index.ts`)

- 扩展 VitePress 默认主题
- 注入暗色模式切换动画（`ViewTransition API`，圆形裁剪展开/收起）
- 在布局插槽中挂载自定义组件:
  - `home-hero-after` -> CopyCodeBox
  - `layout-top` -> Announcement
  - `doc-after` -> Giscus

## 关键依赖与配置

### 运行时依赖

| 包 | 版本 | 说明 |
|---|---|---|
| `vitepress` | ^1.6.4 | 静态文档站生成器 |
| `vue` | ^3.5.27 | 前端框架 |
| `lucide-vue-next` | ^0.563.0 | 图标组件库 |
| `@types/bun` | latest | Bun 类型声明 |
| `typescript` | ^5 (peer) | TypeScript |

### 外部服务

| 服务 | 用途 | 配置位置 |
|---|---|---|
| Cloudflare Pages | 网站托管与 CDN | `wrangler.jsonc` |
| Umami | 匿名访问分析 | `config.mts`（head 中的 script） |
| Giscus | 文档评论系统 | `Giscus.vue`（repo: Mapleawaa/PVE-Tools-9） |
| HarmonyOS Sans | 全局字体 | `config.mts`（head 中的 link） |
| Iconify (MDI) | 功能卡片图标 | `HomeFeaturesWithTimeline.vue`（CSS mask-image） |

### 样式系统

- 主题色: `--vp-c-brand: #646cff`（VitePress 默认紫色系微调）
- 全局字体: HarmonyOS Sans SC（优先）/ PingFang SC / Microsoft YaHei 回退
- 等宽字体: HarmonyOS Sans SC Mono / JetBrains Mono
- 标题/页脚特效: Mesh Gradient 动画（8s ease infinite）
- 暗色模式: 通过 VitePress 的 `isDark` + ViewTransition API 实现

## 数据模型

### todo-data.json 结构

```typescript
interface UpcomingFeature {
  title: string;
  status: "in-progress" | "pending" | "completed";
  description: string;
}

interface TimelineEvent {
  date: string;      // 例如 "2026-04-06"
  event: string;     // 标题
  description: string;
}

interface TodoData {
  upcoming_features: UpcomingFeature[];
  timeline: TimelineEvent[];
}
```

## 测试与质量

- **类型检查**: 使用 TypeScript（peerDependency），Vue 组件使用 `<script setup lang="ts">`
- **构建验证**: `bun run build` 成功即表示所有页面和路由可正常构建
- **死链检查**: 配置 `ignoreDeadLinks: true`（已知某些外部链接可能不可达）
- **代码质量**: 无 lint 配置，组件代码逻辑简单，主要依赖 Vue/VitePress 框架保证

## 常见问题 (FAQ)

**Q: 如何添加新的文档页面？**
在 `Web/` 下创建 `.md` 文件，然后在 `config.mts` 的 `themeConfig.sidebar` 中添加对应条目。

**Q: 如何新增自定义组件？**
在 `Web/.vitepress/theme/components/` 创建 `.vue` 文件，然后在 `theme/index.ts` 中注册到对应布局插槽。

**Q: 构建产物在哪里？**
`Web/.vitepress/dist/`，由 Cloudflare Pages 直接部署。此目录被 `.gitignore` 忽略。

**Q: 数据文件如何加载？**
`todo-data.json` 通过 Vite 的 JSON import 直接导入到 Vue 组件中。

## 相关文件清单

```
Web/
  index.md                          # 首页
  guide.md                          # 使用指南
  features.md                       # 功能特性
  faq.md                            # 常见问题
  update.md                         # 更新日志
  todo.md                           # 开发计划
  sponsor.md                        # 赞助
  pay.md                            # 付费支持
  tos.md                            # 服务条款
  ula.md                            # 用户协议
  submit-plugin.md                  # 插件提交
  package.json                      # 依赖配置
  bun.lock                          # 依赖锁
  wrangler.jsonc                    # Cloudflare 配置
  index.js                          # Workers 入口
  todo-data.json                    # 开发计划数据
  advanced/
    index.md                        # 高级教程总览
    cpu-optimization.md
    data-recovery-after-mistake.md
    gpu-passthrough.md
    gpu-virtualization.md
    host-network-firewall-ipv6.md
    how-to-connect-ssh.md
    nvidia-vgpu-driver-notes.md
    pve-upgrade.md
    storage-management.md
    vm-backup-migration-cloudinit.md
  .vitepress/
    config.mts                      # VitePress 配置
    theme/
      index.ts                      # 主题入口
      custom.css                    # 全局样式
      components/
        Announcement.vue            # 公告横幅
        CopyCodeBox.vue             # 命令复制框
        Giscus.vue                  # 评论组件
        HomeFeaturesWithTimeline.vue # 首页功能+时间线
        TodoList.vue                # 开发计划列表
  public/
    logo.svg                        # 亮色 Logo
    logo-dark.svg                   # 暗色 Logo
    logo-horizontal.svg             # 水平 Logo
    logo-horizontal-dark.svg        # 水平暗色 Logo
  assets/
    images/
      Proxmox-Corporate-Brandguideline.pdf  # Proxmox 品牌指南
      Proxmox_logos_full_lockup_SVG/        # Proxmox 官方 Logo SVG
```

## 变更记录 (Changelog)

| 日期 | 变更 |
|---|---|
| 2026-04-28 | 初始化 Web 模块 CLAUDE.md |
