# 提示词优化插件多语言设计

## 为什么做

插件现在只认中英两种界面：`src/web.js` 里维护一份 136 条的中文→英文映射，靠
`navigator.language` 自己判断该不该用英文。用户在 DSH 设置里把语言切到日语、法语或
德语时，插件面板仍然是中文，模板名、按钮、时间戳全是中文。

DSH 0.2.2-rc.5 自带 8 种可切换语言（`zh`、`en`、`ja`、`es`、`fr`、`de`、`ru`、
`pt`，`pt-PT` 走 `pt`），并且提供官方的插件本地化接口。本设计把插件接到这个接口上，
让面板文案跟设置页的语言一致，切换即时生效、无需刷新。

## 目标

- 8 种语言的界面文案：面板标题、按钮、提示、时间、六维体检、版本对比、模板目录
  （15 个模板的 label/description/useWhen/benefit、分类名）、模式名、严重度、结构
  标记。
- 语言来自 DSH 的 `locale` 服务，随设置页切换实时更新。
- 中文/英文行为与现在一致（中文仍是原文，英文与现有译文一致，允许顺句）。
- 删掉自建的 `detectEnglish`/`makeT`/`EN` 映射，只保留一套字典。
- 文档同步：补葡萄牙语 README 与 TEMPLATES，8 个 README 的语言切换行补齐。
- 设置页插件卡片显示本地化后的标题与简介。

## 非目标

- 不翻译模型返回的优化结果、体检意见：那是模型输出，不是界面文案。
- 不改模板的提示词内容（`src/prompts.js`）；模板指令是给模型的中文语料，翻译它会
  改变产出质量，属于另一件事。
- 不给用户提供“单独指定插件语言”的设置项：跟随 DSH 语言就够了。
- 不引入构建步骤或打包工具。

## 约束

- `engines.dsh` 已经是 `>=0.2.2-rc.5`，`locale` 服务必然存在，不需要降级分支。
- 浏览器端仍是单文件 bundle（`src/web.js`），模块加载器只提供宿主模块，字典必须内联；
  不新增相对 import。
- 现有测试 `node --test test/*.test.mjs` 必须继续通过；新增字典一致性测试。
- 宿主回退链：找不到当前语言的键时回退到 `en`，再找不到就显示键本身。因此 `en`
  字典必须是完整的，其它语言允许缺键但会被测试拦住。

## 方案选择

**A. 接入宿主 locale 服务（选中）**：`inject: ["slots", "locale"]`，在 `apply` 里
`ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt })`，槽位注册加
`locale: NS`，组件收到绑定的 `t`。语言切换由宿主驱动，字典与组件都不需要知道当前语言。
代价是字典内联在 bundle 里（约 +40–60KB），以及所有文案必须经过 `t`。

**B. 沿用自建检测，扩到 8 种**：保留 `navigator.language` 判断，再补 6 份映射。
实现更小，但**不跟 DSH 设置走**——用户明明把 DSH 设成日语，插件还是按浏览器语言显示，
直接违背需求；也没有实时切换。排除。

**C. 由宿主路由下发字典**：新增 `/prompt-optimize/messages?lang=`，客户端拉取。
多一条 HTTP 契约与一次首屏请求，还得自己监听语言变化重拉，比 A 多两个活动部件。
排除。

## 机制（0.2.2-rc.5 实测）

- `ctx.locale.register(ns, { zh, en, ja, es, fr, de, ru, pt })` 注册对象形式字典；
  同一个 ns 的同一语言重复注册会抛错。返回 dispose，用 `ctx.effect` 包住。
- `ctx.locale.bind(ns)` 返回 `t(key, params)`，占位符语法是 `{name}`（单花括号）；
  缺键回退 `en`，再缺回退键本身。
- 槽位注册项带 `locale: NS` 时，渲染器给组件注入 `t` 席位；语言切换会推进 locale
  revision，槽位组件跟着重渲染。
- 参考实现：官方 `@deepseek-ai/dsh-message-quotes/lib/client.js`（8 语言字典 + `locale` 选项）。
- 插件卡片文案：宿主读取包导出的 `locale/<lang>.json`，每份是
  `{ "meta": { "title": ..., "description": ... } }`，并回退到 `package.json` 的
  `name`/`description`；需要在 `exports` 里暴露 `"./locale/*.json"`。

## 键设计

**键就是中文原文。** 现有调用是 `T("提示词优化")`，改造后是 `t("提示词优化")`；
`zh` 字典是键到自身的恒等映射，其它语言是同一批键的译文。理由：

- 136 处调用点不需要重新命名，改动只在字典与 `T`→`t` 本身，映射错位风险为零；
- 缺键时的显示是中文原文而不是 `prompt.title` 之类的占位符；
- 模板元数据不用改 `src/spec.js` 与 `catalog.js`：客户端做
  `t(row.label)`、`t(row.category)`、`t(row.description)`、`t(row.useWhen)` 即可，
  宿主目录契约原样保留（测试也不动）。

模板字段与中文原文一一对应（15 个模板 × 4 字段 + 7 个分类名），与 UI 键合并成同一份
字典；同一中文词在不同位置复用同一条译文。

## 文件结构

- `src/web.js`：
  - `const NS = "promptOptimize"` 与 `const MESSAGES = { zh, en, ja, es, fr, de, ru, pt }`
    内联块，放在组件区之前，用 `/* @messages */` 注释标记起止，供测试定位；
  - 组件内 `const T = t`，删除 `EN`、`detectEnglish`、`makeT`、`useEnglish`；
  - 时间显示用 `Intl.DateTimeFormat`/`Intl.RelativeTimeFormat` + 模块级当前语言 id
    （`apply` 里读 `ctx.locale.getSnapshot().active` 并订阅变化，语言切换时重渲染
    由 locale revision 触发，读到的就是新值）；
  - `apply` 注册字典 + 槽位 `locale: NS`，`inject` 加 `"locale"`；
  - 导出 `__messages`、`__ns` 供测试检查键集。
- `locale/<lang>.json`：8 份插件卡片文案（`meta.title`/`meta.description`）。
- `package.json`：`exports` 增加 `"./locale/*.json"`。版本 0.4.0。
- `README_pt.md`、`docs/TEMPLATES.pt.md`：新增葡萄牙语（巴西）文档；8 个 README 的
  语言切换行补全，`README*.md` 的版本要求行保持现状。
- `test/i18n.test.mjs`：8 语键集对齐、无空串、`{占位符}` 集合一致、`t` 回退行为。

## 验证

- `node --test test/*.test.mjs` 全过（现有 36 + 新增 i18n 用例）。
- 用 vm + 假 `window.__ModuleLoader__` 加载 `src/web.js`，确认 8 份字典导出、键集一致。
- 人工核对：把 DSH 语言切到 ja/de，面板与模板名跟着变；切换回中文恢复。
- 发布：tag `v0.4.0`、GitHub Release（附 tarball），README 同步。

## 风险

- 译文质量：8 种语言由模型生成，术语对齐宿主自带词表（`Model`→`モデル`/`Modell`），
  但长句（如模板 useWhen）可能生硬；用回到设置页的语言真的看一遍。
- 复数与时态：俄语/德语的名词复数没有按数字变形（`{n} 字`），与现有英文实现同级的
  简化，接受。
- bundle 体积增长约 40–60KB，纯本地加载，无网络成本。
