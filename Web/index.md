---
layout: home
title: Proxmox VE 9 一键运维脚本
description: PVE-Tools-9 是面向 Proxmox VE 9.x 的一键运维脚本，覆盖换源、系统维护、VM 生命周期、宿主机网络、防火墙、IPv6、GPU 与 PCI 直通。

hero:
  name: "PVE-Tools-9"
  text: "面向 Proxmox VE 9.x 的一键运维脚本"
  tagline: "从宿主机网络、防火墙、虚拟机生命周期到 GPU 直通，把高频 PVE 运维动作收口到一个脚本里。"
  image:
    light: /logo.svg
    dark: /logo-dark.svg
    alt: PVE-Tools
  actions:
    - theme: brand
      text: 立即开始
      link: /guide
    - theme: alt
      text: 查看功能
      link: /features
    - theme: brand
      text: 更新日志
      link: /update
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/Mapleawaa/PVE-Tools-9

my_features:
  - title: VM 生命周期运维
    details: 支持备份、恢复、模板、克隆、Cloud-Init、快照、磁盘管理与集群迁移。
    iconClass: icon-rocket
  - title: 宿主机网络与防火墙
    details: 覆盖 bridge、Bond、VLAN、IPv4、IPv6、PVE 防火墙、安全组、IPv6 助手与诊断工具箱。
    iconClass: icon-sparkles
  - title: 强安全边界
    details: 为高风险写入路径补充确认词、免责声明、备份提示与回滚导向，尽量避免误操作扩大损失。
    iconClass: icon-harddrive
  - title: GPU 与 PCI 直通
    details: 包含 Intel、NVIDIA、AMD 独显、AMD 核显、RDM、NVMe 与控制器直通能力。
    iconClass: icon-gpu
  - title: 日常系统维护
    details: 支持换源、更新、内核、GRUB、邮件通知、温控与常见系统维护动作。
    iconClass: icon-clock
  - title: 社区与第三方生态
    details: 集成 FastPVE、Modules、Community Scripts，并将高风险第三方动作做了更明确的风险提示。
    iconClass: icon-more
---

<script setup>
import HomeFeaturesWithTimeline from './.vitepress/theme/components/HomeFeaturesWithTimeline.vue'
</script>

<HomeFeaturesWithTimeline />

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
}
</style>
