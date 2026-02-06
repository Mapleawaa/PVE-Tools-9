# CPU 性能调优：让 PVE 跑得更丝滑

很多用户发现 PVE 默认状态下 CPU 频率跳动异常，或者在低负载时功耗依然很高。这通常是因为 CPU 的“调速器（Governor）”配置不当。

## 什么是 CPU 调速器？

调速器是内核中的一个模块，决定了 CPU 频率如何根据负载进行伸缩。

- **performance (性能模式)**：强制 CPU 运行在最高频率。适合追求极致响应速度的场景（如游戏、高频交易）。
- **powersave (节能模式)**：强制 CPU 运行在最低频率。适合纯挂机、对延迟不敏感的场景。
- **ondemand (按需模式)**：有任务时瞬间拉满，闲时降频。这是大部分 Linux 发行版的默认选择。
- **conservative (保守模式)**：频率平滑上升，不像 ondemand 那么激进，更省电。
- **schedutil (负载模式)**：最新的技术，由内核调度器直接控制频率，响应更精准。

## 为什么有些模式选了没用？

这是 ISSUES 中最常被问到的问题。
**原因**：现代 Intel CPU（尤其是 12 代及以后）使用了 `intel_pstate` 驱动。
- 在 `intel_pstate` 驱动下，通常只有 `performance` 和 `powersave` 两种模式。
- 如果你强行选择 `ondemand`，系统会自动回退到默认设置。
- **脚本提示**：PVE-Tools 会读取 `/sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors`，请根据输出的列表进行选择。

## PVE-Tools 的优化方案

1. **一键切换**：脚本提供了可视化菜单，直接写入系统策略。
2. **持久化配置**：通过安装 `cpupower-gui` 或修改系统服务，确保重启后设置不丢失。
3. **微码更新**：脚本会自动检测并安装最新的 CPU Microcode，修复已知的安全漏洞和性能缺陷。

## 进阶建议

如果你追求极致省电，可以尝试在脚本中开启 `conservative` 模式（如果硬件支持）；如果你发现虚拟机内编译软件特别慢，可以临时切换到 `performance`。

> [!TIP]
> 调整 CPU 频率不会导致硬件损坏，但 `performance` 模式会显著增加发热量，请确保你的散热器不是“样子货”。
