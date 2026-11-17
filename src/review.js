/**
 * Turn a model's checkup answer into something safe to show and to apply.
 *
 * The model is asked for one JSON object, but models drift: they wrap it in a
 * fence, use Chinese severity words, quote a paraphrase instead of the text,
 * or return nine issues. Everything here is deliberately forgiving on shape
 * and strict on meaning — an issue only survives when its quote really occurs
 * in the prompt, because the browser applies it as a literal replacement.
 */

/** Dimensions in display order. */
export const REVIEW_DIMENSIONS = Object.freeze([
  "clarity",
  "context",
  "format",
  "constraints",
  "examples",
  "robustness",
]);

const SEVERITIES = new Set(["high", "medium", "low"]);
const SEVERITY_ALIASES = new Map([
  ["高", "high"],
  ["中", "medium"],
  ["低", "low"],
  ["critical", "high"],
  ["major", "high"],
  ["minor", "low"],
  ["warning", "medium"],
  ["info", "low"],
]);

const MAX_ISSUES = 8;
const MAX_SCORE = 100;
const MAX_TITLE = 160;
const MAX_QUOTE = 400;
const MAX_REPLACEMENT = 4000;
const MAX_WHY = 400;
const MAX_SUMMARY = 400;

/** @param {unknown} value */
function clampScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(MAX_SCORE, Math.round(value)));
}

/** @param {unknown} value */
function text(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/**
 * Find the first JSON object in a model answer, tolerating a code fence and
 * any chatter around it.
 * @param {string} raw
 */
export function parseReviewJson(raw) {
  const source = typeof raw === "string" ? raw : "";
  const body = source.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型没有返回 JSON 对象。");
  return JSON.parse(body.slice(start, end + 1));
}

/** @param {unknown} value */
function readSeverity(value) {
  if (typeof value !== "string") return "medium";
  const key = value.trim().toLowerCase();
  if (SEVERITIES.has(key)) return key;
  return SEVERITY_ALIASES.get(key) ?? "medium";
}

/**
 * @param {unknown} raw parsed model answer
 * @param {string} promptText the exact text the checkup was about
 */
export function normalizeReview(raw, promptText) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("模型返回的体检结果不是对象。");
  }
  const source = typeof promptText === "string" ? promptText : "";

  const dims = {};
  let known = 0;
  for (const name of REVIEW_DIMENSIONS) {
    const score = clampScore(raw.dims?.[name]);
    dims[name] = score;
    if (score !== null) known += 1;
  }

  let score = clampScore(raw.score);
  if (score === null && known > 0) {
    const total = REVIEW_DIMENSIONS.reduce((sum, name) => sum + (dims[name] ?? 0), 0);
    score = Math.round(total / known);
  }
  if (score === null) throw new Error("模型没有返回可用的评分。");

  const seen = new Set();
  const issues = [];
  let dropped = 0;
  const rows = Array.isArray(raw.issues) ? raw.issues : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") {
      dropped += 1;
      continue;
    }
    const quote = text(row.quote, MAX_QUOTE);
    const replacement = text(row.replacement, MAX_REPLACEMENT);
    if (quote.length === 0 || replacement.length === 0 || !source.includes(quote) || seen.has(quote)) {
      dropped += 1;
      continue;
    }
    seen.add(quote);
    issues.push({
      severity: readSeverity(row.severity),
      title: text(row.title, MAX_TITLE),
      quote,
      replacement,
      why: text(row.why, MAX_WHY),
    });
  }

  const kept = issues.slice(0, MAX_ISSUES);
  dropped += issues.length - kept.length;

  return {
    score,
    dims,
    issues: kept,
    summary: text(raw.summary, MAX_SUMMARY),
    stats: {
      chars: source.length,
      issues: kept.length,
      dropped,
    },
  };
}
