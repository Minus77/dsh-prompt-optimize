/**
 * The template catalog.
 *
 * Each entry describes how a template is presented in the picker. The prompt
 * text itself lives in `prompts.js`; keeping the two apart means the catalog
 * can be sent to the browser without shipping any model instructions to it.
 *
 * A template `mode` is one of `system` (a reusable system prompt), `user` (a
 * message the user is about to send) or `iterate` (a revision of an earlier
 * result). The composer only exposes `user` and `iterate`.
 */

/** The two optimization modes the composer offers. */
export const MODES = Object.freeze([
  { id: "user", label: "提示词", labelEn: "Prompt" },
  { id: "iterate", label: "迭代优化", labelEn: "Iterate" },
]);

/** Display order of template categories inside the picker. */
export const CATEGORIES = Object.freeze(["基础", "结构", "示范", "推理", "工程", "写作", "迭代"]);

/**
 * Built-in templates.
 *
 * `fields` names the input keys a template consumes; `slots` names the
 * placeholder tokens its prompt text interpolates. Both are checked by the
 * tests in `test/templates.test.mjs`.
 */
export const TEMPLATES = Object.freeze([
  {
    id: "system-role",
    mode: "system",
    category: "基础",
    label: "角色设定",
    labelEn: "Role contract",
    description: "把一句角色描述写成智能体能长期执行的系统提示词。",
    descriptionEn: "Turn a one-line role idea into a system prompt an agent can follow for weeks.",
    useWhen: "你只有一个「让它当什么角色」的念头，细节还没想清。",
    useWhenEn: "You know the role you want but none of the details yet.",
    benefit: "身份、职责、流程与边界一次补齐。",
    benefitEn: "Identity, duties, workflow and limits in one pass.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "system-persona",
    mode: "system",
    category: "基础",
    label: "Agent 人设",
    labelEn: "Agent persona",
    description: "写成带说话方式与判断习惯的人格文件。",
    descriptionEn: "Write a persona file with a voice and a set of judgment habits.",
    useWhen: "你要的是一个有脾气、有取舍的长期搭档。",
    useWhenEn: "You want a long-lived partner with a voice and opinions.",
    benefit: "语气、原则、会做与不会做写得具体。",
    benefitEn: "Concrete tone, principles, and what it will refuse.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-brief",
    mode: "user",
    category: "基础",
    label: "任务简报",
    labelEn: "Task brief",
    description: "目标、材料、交付、约束四段式，最通用的一档。",
    descriptionEn: "Goal, material, deliverable, constraints — the general-purpose rewrite.",
    useWhen: "大多数「帮我做点什么」的草稿。",
    useWhenEn: "Most \"could you help me with…\" drafts.",
    benefit: "补上模型只能靠猜的那部分信息。",
    benefitEn: "Fills in the parts the model would otherwise guess.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-contract",
    mode: "user",
    category: "结构",
    label: "交付契约",
    labelEn: "Delivery contract",
    description: "把验收标准、输入输出和边界情况写在前面。",
    descriptionEn: "Put acceptance criteria, inputs, outputs and edge cases up front.",
    useWhen: "结果要交给别人用，错一点就要返工。",
    useWhenEn: "Someone else will consume the result and rework is expensive.",
    benefit: "先说清「怎样算完成」，再让模型动手。",
    benefitEn: "Defines done before the model starts.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-samples",
    mode: "user",
    category: "示范",
    label: "示例引导",
    labelEn: "Worked examples",
    description: "用两三个输入输出样例锁定风格与格式。",
    descriptionEn: "Pin down style and format with two or three input/output samples.",
    useWhen: "你要的风格很难形容，但一看例子就懂。",
    useWhenEn: "The style is hard to describe but obvious from an example.",
    benefit: "少写形容词，多给可对照的样例。",
    benefitEn: "Fewer adjectives, more side-by-side samples.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-steps",
    mode: "user",
    category: "推理",
    label: "推理步骤",
    labelEn: "Reasoning steps",
    description: "要求模型分步执行并中途自检。",
    descriptionEn: "Ask the model to work in steps and check itself along the way.",
    useWhen: "任务有多个环节，错一步后面全歪。",
    useWhenEn: "The task has stages, and one wrong step poisons the rest.",
    benefit: "把一次大跳跃拆成可检查的小台阶。",
    benefitEn: "Splits one big leap into checkable steps.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-code-review",
    mode: "user",
    category: "工程",
    label: "代码审阅",
    labelEn: "Code review",
    description: "把「帮我看看这段代码」写成一次有范围、有优先级的审阅请求。",
    descriptionEn: "Turn \"can you look at this code\" into a scoped review request with priorities.",
    useWhen: "要发一次代码审阅、PR 描述或安全复查。",
    useWhenEn: "You are asking for a review, a PR read, or a security pass.",
    benefit: "审阅范围、关注点顺序和交付格式都写死，避免泛泛而谈。",
    benefitEn: "Pins the scope, the order of concerns and the report format.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-code-gen",
    mode: "user",
    category: "工程",
    label: "实现任务",
    labelEn: "Implementation task",
    description: "把编码需求补成含验收、接口与边界处理的工程说明。",
    descriptionEn: "Flesh a coding request out into an engineering brief with acceptance and interfaces.",
    useWhen: "要交给智能体或同事实现一个功能、修一个缺陷。",
    useWhenEn: "An agent or teammate will implement a feature or fix a defect.",
    benefit: "验收标准先行，减少「写完才发现不是这个意思」。",
    benefitEn: "Acceptance first, so the build does not miss the point.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-sql",
    mode: "user",
    category: "工程",
    label: "SQL 查询",
    labelEn: "SQL query",
    description: "把一句取数需求写成口径、字段与性能约束都明确的查询任务。",
    descriptionEn: "Make a data request explicit about grain, columns and performance limits.",
    useWhen: "要找数、做报表或核对口径。",
    useWhenEn: "You need data, a report, or a definition checked.",
    benefit: "时间范围、去重和空值处理先说清，少返工。",
    benefitEn: "Time range, dedupe and null handling settled before the query runs.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-extract",
    mode: "user",
    category: "结构",
    label: "结构化抽取",
    labelEn: "Structured extraction",
    description: "把「从这段里取几个字段」写成带 schema 与缺失规则的抽取任务。",
    descriptionEn: "Turn \"pull a few fields out of this\" into an extraction task with a schema.",
    useWhen: "要从邮件、网页或对话里批量取字段。",
    useWhenEn: "You are pulling fields out of mail, pages or transcripts at volume.",
    benefit: "字段类型、枚举与缺失处理明确，输出可直接进程序。",
    benefitEn: "Types, enums and missing-value rules make the output machine-usable.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-test-cases",
    mode: "user",
    category: "工程",
    label: "测试设计",
    labelEn: "Test design",
    description: "把测试需求写成覆盖正常、边界、异常与权限的用例表。",
    descriptionEn: "Write a test request that covers happy path, edges, failures and permissions.",
    useWhen: "功能要验收，或者要补一批回归用例。",
    useWhenEn: "A feature is being accepted or a regression suite is missing.",
    benefit: "用例结构与优先级固定，覆盖不再靠临场想。",
    benefitEn: "A fixed case structure and priority keep coverage from being improvised.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-translate",
    mode: "user",
    category: "写作",
    label: "翻译本地化",
    labelEn: "Translation",
    description: "把翻译需求写成带受众、术语表与格式约束的本地化任务。",
    descriptionEn: "Make a translation request specify audience, glossary and formatting.",
    useWhen: "要翻文档、界面文案或商务邮件。",
    useWhenEn: "You are translating docs, UI copy or business mail.",
    benefit: "保留变量与 Markdown 结构，不擅自增删内容。",
    benefitEn: "Keeps variables and Markdown intact instead of quietly rewriting.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-polish",
    mode: "user",
    category: "写作",
    label: "写作润色",
    labelEn: "Copy polish",
    description: "把润色需求写成允许改动层级、禁止扩写的修订任务。",
    descriptionEn: "Turn \"make this better\" into a revision task with explicit edit limits.",
    useWhen: "文章、公告或说明要改得更清楚，但事实不能动。",
    useWhenEn: "A piece needs to read better without its facts moving.",
    benefit: "先划清能改什么、不能改什么，避免被改写成另一篇。",
    benefitEn: "Draws the line between polish and rewrite up front.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "user-rag",
    mode: "user",
    category: "推理",
    label: "资料问答",
    labelEn: "Grounded Q&A",
    description: "把「根据这些资料回答」写成带引用与未覆盖声明的问答任务。",
    descriptionEn: "Make \"answer from these docs\" cite sources and admit gaps.",
    useWhen: "答案必须能追溯到给定资料。",
    useWhenEn: "The answer has to be traceable to supplied material.",
    benefit: "资料没写到就说没写到，冲突时列出处。",
    benefitEn: "Says when the material is silent, and lists sources on conflict.",
    fields: ["originalPrompt"],
    slots: ["originalPrompt"],
  },
  {
    id: "iterate-tweak",
    mode: "iterate",
    category: "迭代",
    label: "增量改写",
    labelEn: "Incremental edit",
    description: "只改你指出的地方，其余原样保留。",
    descriptionEn: "Change what you point at and leave the rest untouched.",
    useWhen: "上一版已经八九不离十，只差一两处。",
    useWhenEn: "The last version is close and only one or two spots are off.",
    benefit: "不让一次小修改把整段节奏改没。",
    benefitEn: "Keeps a small fix from rewriting the whole thing.",
    fields: ["lastOptimizedPrompt", "iterateInput"],
    slots: ["lastOptimizedPrompt", "iterateInput"],
  },
]);

/** The template a mode starts on. */
export const DEFAULT_TEMPLATE = Object.freeze({
  user: "user-brief",
  iterate: "iterate-tweak",
});

/** Legacy ids kept working for links and bookmarks from earlier releases. */
const ALIASES = Object.freeze({
  "general": "system-role",
  "persona": "system-persona",
  "brief": "user-brief",
  "contract": "user-contract",
  "examples": "user-samples",
  "steps": "user-steps",
  "iterate": "iterate-tweak",
});

/**
 * Resolve one template by id or alias.
 * @param {string} id
 * @returns {(typeof TEMPLATES)[number] | undefined}
 */
export function getTemplate(id) {
  if (typeof id !== "string" || id.length === 0) return undefined;
  const key = ALIASES[id] ?? id;
  return TEMPLATES.find((entry) => entry.id === key);
}

/**
 * Whether the template belongs to the family a mode can use.
 * @param {string} templateId
 * @param {string} mode
 */
export function templateMatchesMode(templateId, mode) {
  const template = getTemplate(templateId);
  if (!template) return false;
  if (mode === "user") return template.mode === "user" || template.mode === "system";
  if (mode === "iterate") return template.mode === "iterate";
  return template.mode === mode;
}

/**
 * The templates offered for a mode, in catalog order.
 * @param {string} mode
 */
export function templatesFor(mode) {
  if (mode === "user") return TEMPLATES.filter((entry) => entry.mode === "user");
  if (mode === "iterate") return TEMPLATES.filter((entry) => entry.mode === "iterate");
  return TEMPLATES.filter((entry) => entry.mode === mode);
}

/**
 * The fallback template id for a mode.
 * @param {string} mode
 */
export function defaultTemplateFor(mode) {
  const preferred = DEFAULT_TEMPLATE[mode];
  if (preferred && templatesFor(mode).some((entry) => entry.id === preferred)) return preferred;
  return templatesFor(mode)[0]?.id;
}

/**
 * The catalog rows the browser receives; prompt text is not included.
 */
export function catalogTemplates() {
  return TEMPLATES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    labelEn: entry.labelEn,
    description: entry.description,
    descriptionEn: entry.descriptionEn,
    category: entry.category,
    useWhen: entry.useWhen,
    useWhenEn: entry.useWhenEn,
    benefit: entry.benefit,
    benefitEn: entry.benefitEn,
    mode: entry.mode,
    fields: [...entry.fields],
    slots: [...entry.slots],
  }));
}
