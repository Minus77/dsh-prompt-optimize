/**
 * Placeholder extraction: parse the model's JSON, validate it, and turn a
 * prompt into a reusable template by replacing anchored spans.
 *
 * The browser half calls `applyVariables` on the text the host returns, so the
 * same rules hold whether the result came from a live model or from a fixture.
 */

const NAME_PATTERN = /^[\p{L}\p{N}_]+$/u;
const MAX_VARIABLES = 5;

/**
 * Remove one code fence that wraps the whole answer.
 * @param {string} text
 */
export function stripFence(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = /^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```$/.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Best-effort repair of JSON a model wrapped in prose or closed sloppily.
 * @param {string} text
 * @returns {string}
 */
export function repairJson(text) {
  let body = stripFence(text);
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  if (first >= 0 && last > first) body = body.slice(first, last + 1);
  return body.replace(/,\s*([}\]])/g, "$1");
}

/**
 * Parse and validate an extraction answer.
 * @param {string} text
 * @returns {{ variables: Array<{ name: string, value: string, anchor: { text: string, occurrence: number }, reason: string }>, summary: string }}
 */
export function parseVariables(text) {
  const trimmed = String(text ?? "").trim();
  if (trimmed.length === 0) throw new Error("模型返回了空内容，无法读取变量。");

  const attempts = [stripFence(trimmed), repairJson(trimmed), trimmed];
  let lastError;
  for (const attempt of attempts) {
    try {
      return normalizeVariables(JSON.parse(attempt));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`无法解析模型返回的变量 JSON：${lastError?.message ?? "格式不正确"}（响应长度 ${trimmed.length} 字）`);
}

/**
 * Validate the extracted payload. Unknown extra fields are dropped.
 * @param {unknown} raw
 */
export function normalizeVariables(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("顶层必须是一个 JSON 对象。");
  }
  const payload = /** @type {{ variables?: unknown, summary?: unknown }} */ (raw);
  if (!Array.isArray(payload.variables)) throw new Error("缺少 variables 数组。");
  if (payload.variables.length > MAX_VARIABLES) {
    throw new Error(`变量最多 ${MAX_VARIABLES} 个，模型返回了 ${payload.variables.length} 个。`);
  }

  const seen = new Set();
  const variables = payload.variables.map((entry, index) => {
    const at = `第 ${index + 1} 个变量`;
    if (typeof entry !== "object" || entry === null) throw new Error(`${at}不是对象。`);
    const row = /** @type {Record<string, unknown>} */ (entry);
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (name.length === 0) throw new Error(`${at}缺少名字。`);
    if (!NAME_PATTERN.test(name)) throw new Error(`${at}的名字「${name}」只能包含文字、数字和下划线。`);
    if (seen.has(name)) throw new Error(`变量名「${name}」重复了。`);
    seen.add(name);

    if (typeof row.value !== "string" || row.value.length === 0) throw new Error(`${at}缺少 value。`);
    if (typeof row.anchor !== "object" || row.anchor === null) throw new Error(`${at}缺少 anchor。`);
    const anchor = /** @type {Record<string, unknown>} */ (row.anchor);
    const anchorText = typeof anchor.text === "string" ? anchor.text : "";
    if (anchorText.length === 0) throw new Error(`${at}的 anchor.text 不能为空。`);
    if (typeof anchor.occurrence !== "number" || !Number.isInteger(anchor.occurrence) || anchor.occurrence < 1) {
      throw new Error(`${at}的 anchor.occurrence 必须是大于 0 的整数。`);
    }
    if (typeof row.reason !== "string") throw new Error(`${at}缺少 reason。`);

    return {
      name,
      value: row.value,
      anchor: { text: anchorText, occurrence: anchor.occurrence },
      reason: row.reason.trim(),
    };
  });

  const summary = payload.summary;
  if (summary !== undefined && typeof summary !== "string") {
    throw new Error("summary 必须是字符串。");
  }
  return { variables, summary: typeof summary === "string" ? summary.trim() : "" };
}

/**
 * The 1-based offset of the nth occurrence of a substring, or -1.
 * @param {string} text
 * @param {string} needle
 * @param {number} occurrence
 */
function nthIndexOf(text, needle, occurrence) {
  let from = 0;
  for (let seen = 0; seen < occurrence; seen += 1) {
    const at = text.indexOf(needle, from);
    if (at < 0) return -1;
    if (seen === occurrence - 1) return at;
    from = at + Math.max(1, needle.length);
  }
  return -1;
}

/**
 * Replace each anchored span with `{{name}}`.
 *
 * Spans must not overlap; when they do the caller gets an error naming both
 * variables rather than a silently mangled template.
 * @param {string} text
 * @param {ReturnType<typeof normalizeVariables>["variables"]} variables
 * @returns {{ templated: string, replaced: number }}
 */
export function applyVariables(text, variables) {
  const source = String(text ?? "");
  const spans = variables.map((variable) => {
    const start = nthIndexOf(source, variable.anchor.text, variable.anchor.occurrence);
    if (start < 0) {
      throw new Error(
        `变量 ${variable.name} 的位置对不上：原文里找不到第 ${variable.anchor.occurrence} 次出现的「${variable.anchor.text}」。`,
      );
    }
    return { name: variable.name, start, end: start + variable.anchor.text.length };
  });

  const ordered = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (current.start < previous.end) {
      throw new Error(
        `变量 ${previous.name} 与 ${current.name} 在原文里重叠，无法套成模板。请只保留其中一个后重试。`,
      );
    }
  }

  // Replace back to front so earlier offsets stay valid.
  let templated = source;
  for (const span of [...ordered].sort((a, b) => b.start - a.start)) {
    templated = `${templated.slice(0, span.start)}{{${span.name}}}${templated.slice(span.end)}`;
  }
  return { templated, replaced: ordered.length };
}
