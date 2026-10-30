# 个人 FnDepot 应用源

飞牛 fnOS 的 FnDepot 第三方应用源，使用 `fnpack.json` V2 结构。

- 源地址：<https://github.com/chens-hi/FnDepot>
- 客户端添加：FnDepot → 应用源 → 填入仓库地址

## 应用

| 应用 | 版本 | 架构 | 分类 |
| --- | --- | --- | --- |
| 快捷图标 | 1.0.287 | x86 / arm | 系统工具 |

fpk 与图标、预览图都放在本仓库的 `shortcuts/` 下，`download_url` 用 `raw.githubusercontent.com` 绝对地址直接分发，不依赖其它仓库。

## 添加规则

- 应用目录为顶层 `<appname>/`，名称必须与 `fnpack.json` 的 `apps` 键、fpk `manifest` 的 `appname` 一致。
- 必填字段：`display_name`、`desc`、`platform`、`categories`、`icon_url`、`run_as`、`install_type`、`is_docker`。
- `platform` 只能是 `all`、`x86`、`arm`，`packages` 的架构键必须与之一致，声明的每个架构都要有对应分支（或 `all`）。
- `categories` 只能取：影音娱乐、系统工具、编程开发、AI赋能、生活服务、智能智控、教育学习、游戏地带、硬件驱动；最多 2 个，第一项为主分类。
- `preview_urls` 最多 8 张，客户端只读前 8 张。
- `source_info.homepage` 填仓库地址；`distributor` 与 `maintainer` 是同一主体时省略，不要重复填写。
- `run_as` 只能是 `package`、`root`；`install_type` 为 `""`（存储空间）或 `root`（系统空间）。
- 版本号用 SemVer；每个版本必须提供可公开下载的 fpk，`download_url`、`sha256`、`size` 必须与文件一致，单应用最多 100 个版本。
- 不填占位地址或临时链接；包失效时应用无法安装。
- `fnpack.json` 不超过 2 MB，应用总数不超过 5000。
- 可选 `readme_url` 指向 `<appname>/README.md`，应用详情页才有 README 页签。
- 推送前必须通过 `node scripts/validate.mjs --strict`。

`sha256` 与 `size` 的获取方式：

```bash
sha256sum <app>.fpk
stat -c%s <app>.fpk
```

## 添加步骤

1. 新建 `<appname>/`，放 `ICON.PNG`、`README.md`，截图放 `Preview/`。
2. 在 `fnpack.json` 的 `apps` 下添加条目，字段可对照现有的 `shortcuts` 条目。
3. 本地校验并推送：

```bash
node scripts/validate.mjs --strict
```

## 收录

主仓每天 00:00 自动扫描，没有 PR 入口；`valid_sources.txt` 由 bot 生成。条件与排障见 [docs/listing.md](docs/listing.md)。
