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
export const CATEGORIES = Object.freeze(["基础", "结构", "示范", "推理", "迭代"]);

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

/** All built-in template ids, in catalog order. */
export const TEMPLATE_IDS = Object.freeze(TEMPLATES.map((entry) => entry.id));

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
