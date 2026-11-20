# 多语言实现计划

I'm using the writing-plans skill to create the implementation plan.

**Goal:** 让插件面板的 8 种语言文案随 DSH 的 `locale` 服务切换，最小化改动、不引入构建步骤。

**Architecture:** 客户端 `src/web.js` 在 `apply` 里把一份内联字典注册到宿主 locale 服务，
槽位注册项声明 `locale: NS`，组件直接使用宿主注入的 `t`；键就是中文原文，`zh` 字典是
恒等映射，模板元数据（label/description/useWhen/benefit/分类）复用同一份字典，宿主目录
契约与 `src/spec.js` 完全不动。

**Tech Stack:** ESM（Node ≥ 24.9）、Cordis 插件、React（宿主提供）、`@deepseek-ai/dsh-client-locale`、`node:test`。

**Spec:** `docs/superpowers/specs/2026-11-21-multilingual-design.md`

**Global Constraints**

- 不新增依赖、不加构建步骤、不新增相对 `import`；字典内联在 `src/web.js`。
- `src/spec.js`、`src/catalog.js`、`src/prompts.js`、`src/index.js`、`src/review.js`、`src/placeholders.js` 不动。
- 保持现有 36 个测试通过；每个切片自带可运行测试并单独 commit。
- 中文、英文显示结果与 0.3.0 一致或更好（英文允许顺句，不允许缺键回落成中文以外的乱码）。
- 提交信息用 Conventional Commits；推送前跑 `node --test test/*.test.mjs` 与 `node --check src/*.js`。

**Review Focus**

1. 键集完整性：8 份字典键集完全一致，`en` 是回退终点。
2. 占位符一致：同一键在各语言里的 `{name}` 集合相同（`{minutes}`、`{input}` 等）。
3. 语言切换实时性：切换 DSH 语言后面板立刻更新，不需要刷新。
4. 模板元数据：15 个模板的 label/description/useWhen 与 7 个分类名都能翻译，目录行仍不带 system/user。
5. 无死代码：`EN`、`detectEnglish`、`makeT`、`useEnglish`、`pick` 的 `english` 分支全部删除。

---

## Task 1: S1 接入 locale 服务（zh/en，行为中性）

**Files:** `src/web.js`、`test/i18n.test.mjs`

**Interfaces:**
- Consumes: `ctx.locale.register(ns, dicts)`、`ctx.locale.bind`、槽位 `locale` 选项、`props.t`。
- Produces: `MESSAGES`（`{zh, en}`）、`NS`、导出 `__messages`、`__ns`、`__timeLabel(at, t, localeId)`。

**Steps:**

- [ ] 写失败测试 `test/i18n.test.mjs`：vm 加载 `src/web.js`（假 `window.__ModuleLoader__` + 桩 react），断言
      `__ns === "promptOptimize"`、`__messages.zh`/`__messages.en` 键集相同、值非空、占位符集合一致；
      断言 `exports.inject` 含 `"locale"`。
- [ ] 跑 `node --test test/i18n.test.mjs`，确认因缺少导出而失败。
- [ ] `src/web.js` 转换表区：`const NS = "promptOptimize"`；`/* @messages */` 标记内定义 `MESSAGES = { zh, en }`，
      `zh` 为中文原文恒等映射（约 200 键：现有 `EN` 的 136 条 + 15 模板 × label/description/useWhen/benefit + 分类 + 模式名），
      `en` 用现有 `EN` 译文；删除 `EN`、`detectEnglish`、`useEnglish`、`makeT`。
- [ ] `pick(row, base, english)` 删除，调用点改 `t(row.label)` 等；`T = useMemo(...)` 删除，组件入口
      `const t = typeof props.t === "function" ? props.t : (key) => key; const T = t;`（保留局部 `T` 减少 136 处改动，后续切片再删别名）。
- [ ] `timeLabel(timestamp, english)` 改 `timeLabel(timestamp, t, localeId)`：相对时间用
      `Intl.RelativeTimeFormat`，同日时刻用 `Intl.DateTimeFormat`，其余保留字典键；模块级 `let activeLocale = "zh"`，
      `apply` 里 `activeLocale = ctx.locale.getSnapshot().active`，并用 `ctx.effect(() => ctx.locale.subscribe(...))` 跟随变化。
- [ ] `apply`：`inject: ["slots", "locale"]`；`ctx.effect(() => ctx.locale.register(NS, MESSAGES), "prompt-optimize: dictionaries")`；
      槽位注册加 `locale: NS`。
- [ ] 跑 `node --test test/*.test.mjs`（37+ 全过）与 `node --check src/web.js`。
- [ ] commit：`feat(client): read panel copy from the host locale service`，push。

## Task 2: S2 补日语、西班牙语、法语

**Files:** `src/web.js`、`test/i18n.test.mjs`

**Interfaces:** Consumes `MESSAGES` 键集；Produces `MESSAGES.ja`、`.es`、`.fr`。

**Steps:**

- [ ] 扩展测试：8 语言列表中出现 `ja/es/fr` 时校验键集与占位符；先跑，确认失败。
- [ ] 以 `en` 键集为准写三份字典（术语对齐 DSH 自带词表：Model→モデル/Modelo/Modèle，Template→テンプレート/Plantilla/Modèle）。
- [ ] 跑测试与 `node --check`；commit `feat(client): add Japanese, Spanish and French copy`，push。

## Task 3: S3 补德语、俄语、葡萄牙语

**Files:** `src/web.js`、`test/i18n.test.mjs`

**Steps:**

- [ ] 测试语言列表加入 `de/ru/pt`，先跑确认失败。
- [ ] 写三份字典（pt 用巴西葡语）。
- [ ] 跑测试；commit `feat(client): add German, Russian and Portuguese copy`，push。

## Task 4: S4 插件卡片本地化

**Files:** `locale/{zh,en,ja,es,fr,de,ru,pt}.json`、`package.json`

**Interfaces:** Consumes 宿主 `readPluginMeta` 的 `locale/<lang>.json` 约定 `{meta:{title,description}}`；
Produces `exports["./locale/*.json"]`。

**Steps:**

- [ ] 写 8 份 `locale/<lang>.json`（zh 与 en 必填，其余同结构）；`package.json` 增 `"./locale/*.json"`。
- [ ] 测试：读 8 个文件，断言 `meta.title`/`meta.description` 非空字符串、键集一致、语言码合法。
- [ ] 跑测试；commit `feat: describe the plugin in each supported language`，push。

## Task 5: S5 文档补齐

**Files:** `README_pt.md`、`docs/TEMPLATES.pt.md`、8 个 `README*.md` 的语言切换行、`package.json` 版本

**Steps:**

- [ ] 由 `README_en.md` 与 `docs/TEMPLATES.en.md` 产出葡语版（保留命令行与链接原样）。
- [ ] 8 个 README 的语言行补上 Português 链接。
- [ ] `package.json` 版本 0.3.0 → 0.4.0；README 安装步骤里的 tarball 名改 `0.4.0`。
- [ ] commit `docs: add Portuguese docs and a language switcher for v0.4.0`，push。

## Task 6: S6 全量验证与发布

**Steps:**

- [ ] `node --test test/*.test.mjs`（含 i18n）全过；`node --check src/*.js`；vm 加载确认 8 份字典导出。
- [ ] `git tag v0.4.0` + push；`npm pack --pack-destination /tmp`（用 `npm_config_cache=/tmp/...` 绕过 EPERM）。
- [ ] `gh release create v0.4.0 --title "v0.4.0 — 八种语言" --notes-file … <tarball>`。
- [ ] 若 npm token 仍失效，报告阻塞，不重试。
