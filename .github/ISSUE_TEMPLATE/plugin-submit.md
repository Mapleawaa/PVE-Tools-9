---

name: 插件提交
about: 提交 Modules 插件脚本（不熟悉 Git 的用户推荐）
title: '\[Plugin] '
labels: plugin-submission
assignees: ''

---

**例行检查**

**必选**

- [ ] 我已确认目前没有重复的插件提交 issue
- [ ] 我理解该脚本会由维护者人工审核，不保证立即合并
- [ ] 我确认脚本文件名将以 `.sh` 结尾
- [ ] 我确认脚本第 2\~5 行包含 `name/author/version/github` 元信息
- [ ] 我理解并同意：脚本存在风险时可能被要求补充说明或直接拒绝
- [ ] 我的脚本使用了Ai辅助开发

**插件文件名**

示例：`install-example.sh`

**脚本内容（完整粘贴）**

```bash
#!/bin/bash
## name:插件名称
## author:作者名
## version:1.0.0
## github:https://github.com/xxx/xxx

echo "hello"
```

**功能说明**

请说明这个插件做什么、适用于什么场景。

**风险与回滚说明**

请说明是否会修改系统关键配置，若执行失败如何回滚。

**测试环境**

例如：PVE 8.3 / PVE 9.0，Debian 版本，是否离线环境等。

**使用的AI模型**

如果您使用AI开发插件，请在此处注明AI模型名称，如果没有使用AI开发请无视此项目。