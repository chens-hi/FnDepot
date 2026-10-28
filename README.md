# 个人 FnDepot 应用源

飞牛 fnOS 的 FnDepot 第三方应用源，使用 `fnpack.json` V2 结构。

- 源地址：<https://github.com/chens-hi/FnDepot>
- 客户端添加：FnDepot → 应用源 → 填入仓库地址

## 状态

`apps` 暂为空，结构合法但不会被主仓收录。至少添加 1 个应用后，次日 00:00（北京时间）自动进入 `valid_sources.txt`。

## 添加规则

- 应用目录为顶层 `<appname>/`，名称必须与 `fnpack.json` 的 `apps` 键、fpk `manifest` 的 `appname` 一致。
- 必填字段：`display_name`、`desc`、`platform`、`categories`、`icon_url`、`run_as`、`install_type`、`is_docker`。
- `platform` 只能是 `all`、`x86`、`arm`，`packages` 的架构键必须与之一致。
- `categories` 只能取：影音娱乐、系统工具、编程开发、AI赋能、生活服务、智能智控、教育学习、游戏地带、硬件驱动。
- `run_as` 只能是 `package`、`root`；`install_type` 为 `""`（存储空间）或 `root`（系统空间）。
- 版本号用 SemVer；每个版本必须提供可公开下载的 fpk，`download_url`、`sha256`、`size` 必须与文件一致，单应用最多 100 个版本。
- 不填占位地址或临时链接；包失效时应用无法安装。
- `fnpack.json` 不超过 2 MB，应用总数不超过 5000。
- 推送前必须通过 `node scripts/validate.mjs --strict`。

`sha256` 与 `size` 的获取方式：

```bash
sha256sum <app>.fpk
stat -c%s <app>.fpk
```

## 添加步骤

1. 新建 `<appname>/`，放 `ICON.PNG`、`README.md`，截图放 `Preview/`。
2. 在 `fnpack.json` 的 `apps` 下添加条目，字段参考 [docs/example-app.json](docs/example-app.json)。
3. 本地校验并推送：

```bash
node scripts/validate.mjs --strict
```

## 收录

主仓每天 00:00 自动扫描，没有 PR 入口；`valid_sources.txt` 由 bot 生成。条件与排障见 [docs/listing.md](docs/listing.md)。
