# 个人 FnDepot 应用源

飞牛 fnOS 的 FnDepot 第三方应用源，使用 `fnpack.json` V2 结构。

- 源地址：<https://github.com/chens-hi/FnDepot>
- 客户端添加：FnDepot → 应用源 → 填入仓库地址

## 状态

`apps` 暂为空，结构合法但不会被主仓收录。至少添加 1 个应用后，次日 00:00（北京时间）自动进入 `valid_sources.txt`。

## 添加应用

1. 新建 `<appname>/`，放 `ICON.PNG`、`README.md`，截图放 `Preview/`。
2. 在 `fnpack.json` 的 `apps` 下添加条目，字段参考 [docs/example-app.json](docs/example-app.json)。`download_url`、`sha256`、`size` 必须与真实 fpk 一致。
3. 本地校验并推送：

```bash
node scripts/validate.mjs --strict
```

分类只能取：影音娱乐、系统工具、编程开发、AI赋能、生活服务、智能智控、教育学习、游戏地带、硬件驱动。

## 收录

主仓每天 00:00 自动扫描，没有 PR 入口；`valid_sources.txt` 由 bot 生成。条件与排障见 [docs/listing.md](docs/listing.md)。
