---
title: VM 备份、迁移与 Cloud-Init
description: 学习 PVE-Tools-9 的 VM 备份恢复、模板克隆、Cloud-Init、磁盘快照、网络管理与集群内迁移工作流。
---

# VM 备份 / 迁移 / Cloud-Init

这篇文档对应脚本中的“虚拟机高级运维工具箱”，覆盖 VM 备份恢复、模板克隆、Cloud-Init、磁盘/快照/网络与集群内迁移等能力。

## 1. 备份与恢复

推荐优先使用脚本中的 **VM 备份与恢复** 菜单，它是对 Proxmox VE 9 官方 `vzdump` / `qmrestore` 的交互式封装：

- 支持单 VM、多 VM、全部 VM 备份。
- 支持 `zstd` / `gzip` / `lzo` 压缩。
- 支持选择 `backup` 内容类型存储。
- 支持通过 `keep-last=N` 形式生成保留策略。
- 支持将备份恢复为新的 VMID，并可选 `--unique 1` 重建 MAC/唯一标识。

### 建议

- 日常备份优先使用 `snapshot` 模式。
- 如果 VM 包含大盘或对 IO 很敏感，先确认目标存储空间和吞吐。
- 恢复新 VM 时，推荐保留 `--unique 1`，避免网络标识冲突。

## 2. 配置导入 / 导出

脚本导出的配置文件本质上是带元信息头部的 `qm config` 快照，导入时采用：

- `qm create` 创建空白 VM
- `qm set` 逐项回放配置

这样做的原因是：

- 避免直接覆盖 `/etc/pve/qemu-server/<VMID>.conf`
- 更符合 PVE 9 集群环境下的安全操作习惯
- 出错时更容易定位具体失败项

### 导入模式

- `config`：只重建配置，不尝试重新绑定磁盘引用
- `rebind-disks`：尝试回放原磁盘引用，要求目标节点能访问同名卷或相同存储

## 3. 模板 / 克隆 / Cloud-Init

### 云镜像模板推荐流程

1. 准备 `.qcow2` / `.raw` / `.img` cloud image。
2. 在“导入云镜像并生成模板”中创建基础 VM。
3. 导入系统盘并挂载 Cloud-Init 盘。
4. 设置 `ciuser`、`sshkeys`、`ipconfig0`、`nameserver` 等参数。
5. 启用 `serial0 + vga serial0`，便于多数 Linux cloud image 正常输出控制台。
6. 转换为模板，再通过完整克隆或链接克隆交付新 VM。

### Cloud-Init 关键约束

- `cicustom` 依赖支持 `snippets` 内容类型的存储。
- 链接克隆只建议对模板使用，且通常要求共享或可克隆存储。
- Windows 场景通常需要 Cloudbase-Init；脚本当前主打 Linux Cloud-Init 流程。

## 4. 磁盘 / 快照 / 启动 / 网络

### 磁盘管理

脚本提供：

- 在线/离线扩容
- 添加磁盘
- 删除磁盘插槽
- 将磁盘迁移到其他存储

### 快照管理

脚本提供：

- 批量创建快照
- 查看指定 VM 快照
- 删除快照
- 回滚到快照

### 启动与网络

脚本提供：

- 开机自启 `onboot`
- 启动顺序 `boot order=...`
- 启动延迟 `startup=...`
- 网卡新增/删除
- bridge 与 VLAN 修改

## 5. 集群内迁移

脚本当前实现的是 **集群内 `qm migrate` 封装**，而不是远程集群迁移。

### 迁移前检查

- 目标节点是否在线
- 目标存储是否存在或能通过 `--targetstorage` 正确映射
- 是否携带本地磁盘一起迁移
- VM 是否带有 PCI / GPU / NVMe 直通等硬件绑定能力

### 为什么没有做 `remote-migrate`

因为在当前 PVE 9 官方文档语境里，`qm remote-migrate` 仍不适合作为脚本默认自动化入口；首版更稳妥的做法是先把集群内迁移和备份恢复型迁移做好。

## 6. 推荐组合方案

### 模板化交付

- cloud image -> Cloud-Init -> 模板 -> 链接克隆

### 保险型迁移

- `vzdump` 备份 -> `qmrestore` 到新 VMID -> 验证业务 -> 切换流量

### 日常运维

- 快照 -> 修改磁盘/网络/启动策略 -> 验证 -> 必要时回滚

## 7. 误操作后的恢复优先级

如果你在备份恢复、配置导入、模板/克隆、Cloud-Init、磁盘、快照或迁移过程中误操作了对象，第一原则不是继续尝试修正，而是先停止继续写入。

- 先停掉相关 VM、暂停后续自动任务、避免新的 clone/restore/move/rollback 覆盖现场。
- 立即导出 qm config、任务日志、存储状态与集群状态，保留恢复证据。
- 再参考 [误操作后的数据恢复](/advanced/data-recovery-after-mistake) 评估数据存活概率和是否需要升级到专业恢复。
