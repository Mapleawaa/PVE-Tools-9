---
title: 提交插件
description: 通过 Pull Request 或 Issue Template 提交 Modules 插件脚本。
---

# 提交插件

推荐两种提交方式：

- **懂 Git 的用户**：直接 Fork 仓库并提交 PR
- **不熟悉 Git 的用户**：通过 Issue Template 提交插件需求或脚本内容

提交前请确认：

- 文件名必须以 `.sh` 结尾
- 脚本第 2~5 行必须包含元信息
- 涉及高风险操作必须在脚本中给出明确交互确认

```bash
#!/bin/bash
## name:插件名称
## author:作者名
## version:1.0.0
## github:https://github.com/xxx/xxx
```

## 方式一：直接提交 PR（推荐）

1. Fork 本仓库
2. 新建分支并添加脚本到 `Modules/<your-script>.sh`
3. 在 PR 描述中补充脚本用途、风险提示、回滚方式
4. 等待维护者审核与合并

## 方式二：使用 Issue Template

请在仓库的 Issue 页面选择 **“插件提交”** 模板，按字段填写：

- 脚本文件名
- 脚本内容
- 元信息（name/author/version/github）
- 功能说明与风险说明

维护者会根据模板内容决定是否代提 PR 或邀请你补充后再处理。
