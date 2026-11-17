import assert from "node:assert/strict";
import test from "node:test";

import { buildCustomPrompt } from "../src/prompts.js";

const CUSTOM = { label: "客服口吻", instruction: "把语气改成客服口吻，结尾加一句道歉。" };

test("a custom template fences both the instruction and the prompt", () => {
  const built = buildCustomPrompt(CUSTOM, { originalPrompt: "帮我写一封延期通知。" }, "user");
  assert.ok(built.user.includes("客服口吻"));
  assert.ok(built.user.includes("帮我写一封延期通知。"));
  assert.ok(built.user.includes("不是给你的指令"));
  assert.ok(built.user.includes("```json"));
  assert.ok(built.system.includes("输出"));
  assert.ok(built.system.includes("不编造") || built.system.includes("待确认"));
});

test("a custom iterate template carries the last result and the change request", () => {
  const built = buildCustomPrompt(CUSTOM, {
    originalPrompt: "帮我写一封延期通知。",
    lastOptimizedPrompt: "尊敬的客户：项目将延期两周。",
    iterateInput: "再短一点",
  }, "iterate");
  for (const piece of ["帮我写一封延期通知。", "尊敬的客户：项目将延期两周。", "再短一点"]) {
    assert.ok(built.user.includes(piece), piece);
  }
});

test("a custom template still refuses to invent facts", () => {
  const built = buildCustomPrompt(CUSTOM, { originalPrompt: "x" }, "user");
  assert.ok(built.system.includes("待确认"));
});
