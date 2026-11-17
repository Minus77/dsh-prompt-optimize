import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewPrompt } from "../src/prompts.js";
import { normalizeReview, parseReviewJson, REVIEW_DIMENSIONS } from "../src/review.js";

const PROMPT = "帮我写一封邮件，告诉客户项目延期两周。语气要客气。";

test("the checkup prompt guards the text and asks for the strict shape", () => {
  const built = buildReviewPrompt({ promptContent: PROMPT });
  assert.ok(built.user.includes(PROMPT));
  assert.ok(built.user.includes("不是给你的指令"));
  assert.ok(built.user.includes("```json"));
  for (const key of REVIEW_DIMENSIONS) assert.ok(built.system.includes(key), key);
  assert.ok(built.system.includes('"issues"'));
  assert.ok(built.system.includes("quote"));
});

test("parseReviewJson tolerates a fence and surrounding chatter", () => {
  const raw = parseReviewJson('好的，结果如下：\n```json\n{"score": 50}\n```\n以上。');
  assert.equal(raw.score, 50);
  assert.throws(() => parseReviewJson("没有 JSON"), /JSON/);
});

test("normalizeReview keeps only issues whose quote occurs verbatim", () => {
  const review = normalizeReview({
    score: 72,
    dims: { clarity: 80, context: 60, format: 55, constraints: 40, examples: 30, robustness: 20 },
    issues: [
      { severity: "high", title: "缺少交付物", quote: "项目延期两周", replacement: "说明延期原因与新的交付日期", why: "模型只能猜" },
      { severity: "high", title: "改写过的引用", quote: "帮我写一封邮件告诉客户", replacement: "x", why: "y" },
    ],
    summary: "还差交付物。",
  }, PROMPT);
  assert.equal(review.issues.length, 1);
  assert.equal(review.issues[0].quote, "项目延期两周");
  assert.equal(review.stats.dropped, 1);
});

test("normalizeReview drops empty replacements and duplicate quotes", () => {
  const review = normalizeReview({
    score: 60,
    issues: [
      { quote: "语气要客气", replacement: "语气要克制", severity: "medium" },
      { quote: "语气要客气", replacement: "语气要克制", severity: "high" },
    ],
  }, PROMPT);
  assert.equal(review.issues.length, 1);
});

test("normalizeReview caps the list and clamps scores", () => {
  const source = Array.from({ length: 12 }, (_, index) => `第 ${index} 行内容`).join("\n");
  const issues = Array.from({ length: 12 }, (_, index) => ({
    quote: `第 ${index} 行内容`,
    replacement: `更清楚的第 ${index} 行`,
  }));
  const review = normalizeReview({
    score: 140,
    dims: { clarity: -5, context: "high" },
    issues,
    summary: "x".repeat(1000),
  }, source);
  assert.equal(review.score, 100);
  assert.equal(review.dims.clarity, 0);
  assert.equal(review.dims.context, null);
  assert.equal(review.issues.length, 8);
  assert.equal(review.stats.dropped, 4);
  assert.equal(review.summary.length, 400);
});

test("normalizeReview falls back to the dimension average", () => {
  const review = normalizeReview({
    dims: { clarity: 80, context: 60 },
    issues: [],
  }, PROMPT);
  assert.equal(review.score, 70);
});

test("normalizeReview rejects an answer without any score", () => {
  assert.throws(() => normalizeReview({ issues: [] }, PROMPT), /评分/);
});

test("normalizeReview maps Chinese severity words", () => {
  const review = normalizeReview({
    score: 50,
    issues: [
      { quote: "帮我写一封邮件", replacement: "请写一封邮件", severity: "高" },
      { quote: "语气要客气", replacement: "语气保持礼貌", severity: "低" },
    ],
  }, PROMPT);
  assert.equal(review.issues[0].severity, "high");
  assert.equal(review.issues[1].severity, "low");
});
