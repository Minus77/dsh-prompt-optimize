import assert from "node:assert/strict";
import test from "node:test";

import { applyVariables, normalizeVariables, parseVariables, repairJson, stripFence } from "../src/placeholders.js";

const sample = {
  variables: [
    { name: "client", value: "ACME", anchor: { text: "ACME", occurrence: 1 }, reason: "客户名会变" },
    { name: "deadline", value: "3 月 4 日", anchor: { text: "3 月 4 日", occurrence: 1 }, reason: "日期会变" },
  ],
  summary: "两处可替换",
};

test("stripFence removes one wrapping fence only", () => {
  assert.equal(stripFence("```json\n{\"a\":1}\n```"), "{\"a\":1}");
  assert.equal(stripFence("plain"), "plain");
  assert.equal(stripFence("```\ntext\n```\nmore"), "```\ntext\n```\nmore");
});

test("repairJson trims prose and trailing commas", () => {
  assert.equal(repairJson("答案是：{\"a\":[1,2,],} 完毕"), "{\"a\":[1,2]}");
});

test("parseVariables accepts a plain, fenced, or prose-wrapped answer", () => {
  const plain = parseVariables(JSON.stringify(sample));
  assert.equal(plain.variables.length, 2);
  assert.equal(plain.summary, "两处可替换");

  const fenced = parseVariables(`\`\`\`json\n${JSON.stringify(sample)}\n\`\`\``);
  assert.equal(fenced.variables[1].name, "deadline");

  const prose = parseVariables(`好的，结果如下：${JSON.stringify(sample)} 希望有帮助`);
  assert.equal(prose.variables[0].anchor.occurrence, 1);
});

test("parseVariables rejects unreadable answers", () => {
  assert.throws(() => parseVariables(""), /空内容/);
  assert.throws(() => parseVariables("not json"), /无法解析/);
});

test("normalizeVariables enforces names, anchors and unique keys", () => {
  assert.throws(
    () => normalizeVariables({ variables: [{ name: "a b", value: "x", anchor: { text: "x", occurrence: 1 }, reason: "" }] }),
    /只能包含文字、数字和下划线/,
  );
  assert.throws(
    () => normalizeVariables({ variables: [{ name: "a", value: "x", anchor: { text: "x", occurrence: 0 }, reason: "" }] }),
    /大于 0 的整数/,
  );
  assert.throws(
    () => normalizeVariables({
      variables: [
        { name: "a", value: "x", anchor: { text: "x", occurrence: 1 }, reason: "" },
        { name: "a", value: "y", anchor: { text: "y", occurrence: 1 }, reason: "" },
      ],
    }),
    /重复/,
  );
  assert.throws(() => normalizeVariables({ variables: [] , summary: 1 }), /summary/);
  assert.throws(() => normalizeVariables({ nope: true }), /variables/);
});

test("normalizeVariables caps the list at five", () => {
  const variables = Array.from({ length: 6 }, (_, index) => ({
    name: `v${index}`, value: `x${index}`, anchor: { text: `x${index}`, occurrence: 1 }, reason: "",
  }));
  assert.throws(() => normalizeVariables({ variables, summary: "" }), /最多 5 个/);
});

test("applyVariables replaces the anchored occurrence only", () => {
  const text = "给 ACME 写信，提醒 ACME 在 3 月 4 日之前回复。";
  const { templated, replaced } = applyVariables(text, normalizeVariables(sample).variables);
  assert.equal(replaced, 2);
  assert.equal(templated, "给 {{client}} 写信，提醒 ACME 在 {{deadline}}之前回复。");
});

test("applyVariables honours a 1-based occurrence", () => {
  const text = "Bob met Bob at Bob's place.";
  const payload = normalizeVariables({
    variables: [{ name: "second_bob", value: "Bob", anchor: { text: "Bob", occurrence: 2 }, reason: "" }],
    summary: "",
  });
  assert.equal(applyVariables(text, payload.variables).templated, "Bob met {{second_bob}} at Bob's place.");
});

test("applyVariables reports a missing anchor", () => {
  const variables = normalizeVariables({
    variables: [{ name: "ghost", value: "nope", anchor: { text: "nope", occurrence: 2 }, reason: "" }],
    summary: "",
  }).variables;
  assert.throws(() => applyVariables("nope once", variables), /位置对不上/);
});

test("applyVariables rejects overlapping spans", () => {
  const variables = normalizeVariables({
    variables: [
      { name: "outer", value: "abcde", anchor: { text: "abcde", occurrence: 1 }, reason: "" },
      { name: "inner", value: "cde", anchor: { text: "cde", occurrence: 1 }, reason: "" },
    ],
    summary: "",
  }).variables;
  assert.throws(() => applyVariables("xx abcde yy", variables), /重叠/);
});

test("applyVariables accepts adjacent spans", () => {
  const variables = normalizeVariables({
    variables: [
      { name: "first", value: "abc", anchor: { text: "abc", occurrence: 1 }, reason: "" },
      { name: "second", value: "def", anchor: { text: "def", occurrence: 1 }, reason: "" },
    ],
    summary: "",
  }).variables;
  assert.equal(applyVariables("abcdef", variables).templated, "{{first}}{{second}}");
});
