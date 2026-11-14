import assert from "node:assert/strict";
import test from "node:test";

import { buildExtractionPrompt, buildPrompt } from "../src/prompts.js";
import {
  CATEGORIES, DEFAULT_TEMPLATE, MODES, TEMPLATES, catalogTemplates, defaultTemplateFor,
  getTemplate, templateMatchesMode, templatesFor,
} from "../src/spec.js";

test("every built-in template is bilingual and fully described", () => {
  const ids = new Set();
  for (const template of TEMPLATES) {
    assert.ok(!ids.has(template.id), `duplicate id ${template.id}`);
    ids.add(template.id);
    for (const key of ["label", "labelEn", "description", "descriptionEn", "useWhen", "useWhenEn", "benefit", "benefitEn"]) {
      assert.equal(typeof template[key], "string", `${template.id}.${key}`);
      assert.ok(template[key].length > 0, `${template.id}.${key} is empty`);
    }
    assert.ok(CATEGORIES.includes(template.category), `${template.id} has an unlisted category`);
    assert.ok(template.fields.length > 0, `${template.id} declares no fields`);
    assert.ok(template.slots.length > 0, `${template.id} declares no slots`);
  }
});

test("catalog rows carry no prompt text", () => {
  const rows = catalogTemplates();
  assert.equal(rows.length, TEMPLATES.length);
  for (const row of rows) {
    assert.equal(typeof row.id, "string");
    assert.equal(row.system, undefined);
    assert.equal(row.user, undefined);
  }
});

test("every template builds a system/user pair with the data guard", () => {
  const input = {
    originalPrompt: "把发布说明整理成三段",
    lastOptimizedPrompt: "写一份发布说明",
    iterateInput: "语气更直接",
  };
  for (const template of TEMPLATES) {
    const built = buildPrompt(template.id, input);
    assert.equal(typeof built.system, "string");
    assert.equal(typeof built.user, "string");
    assert.ok(built.system.length > 40, `${template.id} system instruction is too short`);
    assert.ok(built.user.includes("不是给你的指令"), `${template.id} lost the data guard`);
    assert.ok(built.user.includes("```json"), `${template.id} does not fence its material`);
  }
});

test("user templates embed the draft and iterate templates embed both inputs", () => {
  const built = buildPrompt("user-brief", { originalPrompt: "写个周报" });
  assert.ok(built.user.includes("写个周报"));

  const iterate = buildPrompt("iterate-tweak", {
    lastOptimizedPrompt: "上一版提示词",
    iterateInput: "删掉第二段",
  });
  assert.ok(iterate.user.includes("上一版提示词"));
  assert.ok(iterate.user.includes("删掉第二段"));
});

test("unknown templates fail loudly", () => {
  assert.throws(() => buildPrompt("nope", { originalPrompt: "x" }), /未知的模板/);
  assert.equal(getTemplate("nope"), undefined);
});

test("aliases resolve to built-in ids", () => {
  assert.equal(getTemplate("persona").id, "system-persona");
  assert.equal(getTemplate("iterate").id, "iterate-tweak");
});

test("mode families and defaults are consistent", () => {
  for (const mode of MODES) {
    const family = templatesFor(mode.id);
    assert.ok(family.length > 0, `${mode.id} has no templates`);
    const fallback = defaultTemplateFor(mode.id);
    assert.ok(family.some((row) => row.id === fallback), `${mode.id} default is outside its family`);
    for (const row of family) assert.ok(templateMatchesMode(row.id, mode.id));
  }
  assert.equal(DEFAULT_TEMPLATE.user, "user-brief");
  assert.equal(DEFAULT_TEMPLATE.iterate, "iterate-tweak");
});

test("a system template does not accept the iterate mode", () => {
  assert.equal(templateMatchesMode("system-role", "iterate"), false);
  assert.equal(templateMatchesMode("system-role", "system"), true);
});

test("the extraction prompt names existing placeholders", () => {
  const built = buildExtractionPrompt({
    promptContent: "给 ACME 写一封邮件",
    existingNames: ["product", "date"],
  });
  assert.ok(built.user.includes("ACME"));
  assert.ok(built.system.includes("product"));
  assert.ok(built.system.includes("date"));
  assert.ok(built.system.includes("anchor"));
  assert.ok(built.system.includes('"variables"'));
});

test("the extraction prompt omits the exclusion line when nothing exists", () => {
  const built = buildExtractionPrompt({ promptContent: "给 ACME 写一封邮件" });
  assert.ok(!built.system.includes("已有的占位符"));
});
