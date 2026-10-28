# 收录与 PR 说明

本文说明 `https://github.com/chens-hi/FnDepot` 如何进入主仓 `EWEDLCM/FnDepot`，以及哪些做法无效。

## 结论先行

- **收录没有 PR 入口。** 主仓根目录的 `valid_sources.txt` 由 `.github/workflows/update-sources.yml` 每天 UTC 16:00（北京时间 00:00）运行 `scripts/generate_sources.py` 生成，并直接 commit + push。
- 该脚本不读取任何人工维护的名单，每次运行都会整体重写文件。**直接 PR 修改 `valid_sources.txt` 会在次日被覆盖。**
- 主仓 README 允许提 PR/Issue，但那是把应用收进主仓**内置源**，不是收录你的源仓。

## 路径 A：自动收录（推荐）

### 前置条件

1. 仓库默认分支（`main`）根目录有大小写精确的 `fnpack.json`。
2. 文件是合法 JSON，`schema_version` 为 `"2"`（V1 也兼容）。
3. `apps` 数量在 1–5000 之间。**空 `apps` 不会被收录。**
4. `source_info.name`、`source_info.author` 非空；author 归一化后不能等于 `fndepot`。
5. 每个应用至少有 `display_name`、`desc`；`is_docker` 为布尔；`install_type` 为 `""` 或 `"root"`；`run_as` 为 `package` 或 `root`。
6. 仓库 6 个月内有活动；不在主仓黑名单；与已有源的重叠率不超过阈值。
7. 仓库能被 GitHub 搜索到：搜索词包括 `fndepot`、`fn depot`、`filename:fnpack.json`。

### 操作

1. 在汇总仓添加至少一个真实应用：`download_url` 可下载，`sha256` 与 `size` 与实际文件一致。
2. 本地通过严格校验：

```bash
node scripts/validate.mjs --strict
```

3. 推送到 `main`。
4. 在 GitHub 仓库设置中把 Description 写成含 `FnDepot` 的说明，建议 topics：`fnnas`、`fnos`、`fndepot`。
5. 等待次日 00:00（北京时间）主仓 bot 运行，检查 `https://github.com/EWEDLCM/FnDepot/blob/main/valid_sources.txt` 是否出现 `https://github.com/chens-hi/FnDepot`。

### 排障清单

- 文件名是否精确为 `fnpack.json`（大小写敏感）。
- 默认分支是否为 `main`，文件是否在根目录。
- `apps` 是否为空；必填字段是否齐全。
- 最近 6 个月是否有提交。
- author 是否被归一化成 `fndepot`。
- 是否与已有源内容高度重复（阈值：fork 50%/30%，普通源 85%/70%）。
- 是否命中了主仓脚本中的黑名单。

## 路径 B：PR 进主仓（仅限应用并入内置源）

适用于你希望应用出现在主仓自带源、而不是自己的源仓。

1. Fork `EWEDLCM/FnDepot`，从 `main` 拉分支 `add-<appname>`。
2. 按主仓现有风格新增顶层 `<appname>/`：`ICON.PNG`、`README.md`、可选 `Preview/`，以及 fpk 文件或外链。
3. 编辑主仓根 `fnpack.json`，在 `apps` 下新增条目。`download_url`、`sha256`、`size` 必须真实：

```bash
sha256sum <app>.fpk
stat -c%s <app>.fpk
```

4. 用本仓校验器检查主仓文件：

```bash
node scripts/validate.mjs --input <主仓路径>/fnpack.json
```

5. 提 PR，描述中包含：应用名、上游项目、fpk 下载地址、sha256、fnOS 测试版本、界面截图。
6. 不要 PR 修改 `valid_sources.txt`。

## 与主仓同步

主仓的扫描规则没有独立文档，本仓的 `scripts/validate.mjs` 按主仓 README 与 `generate_sources.py` 的硬性规则复刻。若主仓脚本变更，需要同步更新：

- `scripts/validate.mjs` 的字段与阈值。
- 本文的收录条件。
