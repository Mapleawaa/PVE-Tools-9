[根目录](../CLAUDE.md) > **.github**

# .github -- CI/CD 工作流与社区治理

## 模块职责

管理项目的持续集成/持续部署流水线和社区 Issue 模板。三条工作流覆盖 PR 验证、正式发布和测试版发布。发布物为 `dist/PVE-Tools.sh` 单文件 + `SHA256SUMS.txt`（不使用 shc 编译二进制）。

## 入口与启动

| 项目 | 说明 |
|---|---|
| 触发方式 | GitHub Actions，由 push（tag）/pull_request 事件触发 |
| 运行环境 | `ubuntu-latest` |
| 权限 | `contents: write`（两个 Release 工作流需要） |

## 工作流清单

### pr-validation.yml -- PR 验证工作流

**触发条件**: PR 到 `main` 或 `beta` 分支

| 检查 | 说明 |
|---|---|
| Shellcheck（入口） | `shellcheck -f gcc PVE-Tools.sh`，error/warning 均失败 |
| Shellcheck（全源码） | `find lib src/modules -name '*.sh' \| xargs shellcheck --severity=error`，error 级卡死 |
| 语法检查 | `bash -n` 入口/dev.sh，`bash build.sh` 后 `bash -n dist` |
| Shellcheck（产物） | dist 的 error/warning 均失败 |
| 构建一致性 | 源码与 dist 的函数集合双向 diff，不一致即失败 |
| 版本一致性 | `CURRENT_VERSION`（lib/config.sh）== `VERSION` 文件 |
| UPDATE 新鲜度 | `UPDATE` 首行必须包含当前版本号（防更新日志脱节） |
| 安全扫描 | dist 中禁 `eval`、未加引号变量开头的 `rm -rf`、`source` 语句，命中即失败 |

### release.yml -- 正式发布工作流

**触发条件**: 推送 `v*.*.*` / `*.*.*` / `*-stable` 标签；**排除** `-beta*` / `-alpha*` / `-rc*`（预发布标签只归 beta-release.yml，避免双流水线竞争同一 tag）

**步骤**:
1. checkout（fetch-depth: 0）-> 从 tag 提取版本号
2. `bash build.sh` 构建 dist
3. **发布前校验**（打 tag 直发不绕过质量闸门）：`bash -n dist`、`shellcheck --severity=error dist`、函数集合一致性 diff、版本三方一致（tag == config == VERSION）
4. 生成 `SHA256SUMS.txt`
5. 基于 git 提交历史生成 release notes
6. `softprops/action-gh-release@v2` 创建 Release，上传 `dist/PVE-Tools.sh` + `dist/SHA256SUMS.txt`

**注意**: 远程安装链路依赖 `releases/latest/download/PVE-Tools.sh`，正式发版后新用户方能获取最新版。

### beta-release.yml -- 测试版发布工作流

**触发条件**: 推送 `-beta*` / `-alpha*` 标签

与 release.yml 类似但 `prerelease: true`；同样执行构建质量校验（语法/shellcheck/函数一致性），版本号断言放宽（beta 标签允许与 config 版本不同步）。

## Issue 模板

| 文件 | 用途 |
|---|---|
| `fast-bugs-report.md` | 快速 Bug 报告 |
| `feature-request.md` | 功能请求 |
| `plugin-submit.md` | 插件提交 |
| `report-bugs.md` | 详细 Bug 报告 |
| `config.yml` | Issue 模板配置 |

## 其他文件

| 文件 | 用途 |
|---|---|
| `FUNDING.yml` | GitHub Sponsors 赞助配置 |

## 关键依赖与配置

- **GitHub Actions**: `ubuntu-latest` runner（自带 shellcheck）
- **softprops/action-gh-release@v2**: 创建 Release 与上传资产

## 常见问题 (FAQ)

**Q: 发版时需要同步哪些版本号？**
三处：`lib/config.sh` 的 `CURRENT_VERSION`、`VERSION` 文件、`UPDATE` 首行条目，且正式发布 tag 必须与之一致——任何一处不同步都会被 CI 拦下。

**Q: PR 验证中 build.sh 失败怎么办？**
检查 lib/ 与 src/modules/ 文件是否齐全、语法是否正确；新增 lib 文件需同步 build.sh / dev.sh / PVE-Tools.sh 三处加载列表。

**Q: 如何添加新的 Issue 模板？**
在 `ISSUE_TEMPLATE/` 目录添加 `.md` 文件并更新 `config.yml`。

## 相关文件清单

```
.github/
  workflows/
    release.yml                    # 正式发布（含发布前校验与 SHA256SUMS）
    beta-release.yml               # 测试版发布（含构建校验）
    pr-validation.yml              # PR 验证（8 项检查）
  ISSUE_TEMPLATE/                  # Issue 模板 5 件
  FUNDING.yml                      # 赞助配置
```

## 变更记录 (Changelog)

| 日期 | 变更 |
|---|---|
| 2026-07-26 | 按现实重写：移除 shc 描述；补充发布前校验/SHA256SUMS/UPDATE 新鲜度/安全扫描细节；记录正式与预发布标签互斥规则 |
| 2026-07-08 | 初始化 .github 模块 CLAUDE.md |
