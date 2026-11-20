import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

function loadClient() {
  const code = readFileSync(new URL("../src/web.js", import.meta.url), "utf8");
  let factory;
  const sandbox = {
    window: { __ModuleLoader__: { load: ({ factory: f }) => { factory = f; } } },
    document: {
      createElement: () => ({
        style: {}, appendChild() {}, setAttribute() {},
        set textContent(value) {}, get textContent() { return ""; },
      }),
      head: { appendChild() {} },
      body: { appendChild() {} },
      documentElement: { style: {} },
      addEventListener() {},
      removeEventListener() {},
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { language: "zh-CN" },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "web.js" });
  const React = {
    createElement: () => null,
    Fragment: "Fragment",
    useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    useEffect() {},
    useRef: () => ({ current: null }),
    useCallback: (fn) => fn,
    useSyncExternalStore: (subscribe, snapshot) => snapshot(),
  };
  const mods = { react: React, "react-dom": { createPortal: () => null } };
  return factory((name) => mods[name]);
}

const client = loadClient();
const LOCALES = ["zh", "en", "ja", "es", "fr", "de", "ru", "pt"];

function placeholders(value) {
  return [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

test("client exports one dictionary namespace with zh and en", () => {
  assert.equal(client.__ns, "promptOptimize");
  assert.ok(client.__messages.zh, "zh dictionary");
  assert.ok(client.__messages.en, "en dictionary");
  assert.equal(client.__messages.zh["提示词优化"], "提示词优化");
  assert.equal(client.__messages.en["提示词优化"], "Prompt optimizer");
});

test("every dictionary covers the same keys with real text and matching placeholders", () => {
  const base = Object.keys(client.__messages.en).sort();
  assert.ok(base.length > 150, `expected a full key set, found ${base.length}`);
  for (const locale of LOCALES) {
    const dict = client.__messages[locale];
    if (!dict) continue;
    assert.deepEqual(Object.keys(dict).sort(), base, `${locale} key set`);
    for (const key of base) {
      const value = dict[key];
      assert.equal(typeof value, "string", `${locale}:${key} is a string`);
      assert.ok(value.trim().length > 0, `${locale}:${key} is not empty`);
      assert.deepEqual(placeholders(value), placeholders(client.__messages.en[key]), `${locale}:${key} placeholders`);
    }
  }
});

test("template metadata is translated through the same dictionary", () => {
  const dict = client.__messages.en;
  for (const key of ["任务简报", "角色设定", "迭代优化", "基础", "工程"]) {
    assert.ok(typeof dict[key] === "string" && dict[key] !== key, `template key ${key}`);
  }
});

test("apply registers the dictionaries and the locale namespace on the slot", () => {
  const registered = [];
  const slot = {};
  const ctx = {
    effect: (fn) => { fn(); },
    locale: {
      register(ns, dicts) { registered.push({ ns, dicts }); return () => {}; },
      subscribe() { return () => {}; },
      getSnapshot: () => ({ active: "ja" }),
    },
    slots: {
      inject(name, fn) { fn(); },
      register(options) { slot.options = options; return () => {}; },
    },
  };
  client.apply(ctx);
  assert.equal(registered.length, 1);
  assert.equal(registered[0].ns, "promptOptimize");
  assert.equal(registered[0].dicts, client.__messages);
  assert.equal(slot.options.locale, "promptOptimize");
  assert.equal(slot.options.id, "prompt-optimize");
  assert.ok(client.inject.includes("locale"));
});

test("time labels follow the dictionary", () => {
  const now = Date.now();
  assert.equal(client.__timeLabel(now - 30_000, (key) => key), "刚刚");
  assert.equal(client.__timeLabel(now - 30_000, (key) => (key === "刚刚" ? "just now" : key)), "just now");
  assert.match(client.__timeLabel(now - 5 * 60_000, (key) => (key === "分钟前" ? "min ago" : key)), /^5 min ago$/);
});

test("plugin cards have a locale file for every shipped language", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const dir = new URL("../locale/", import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  assert.deepEqual(files, LOCALES.map((locale) => `${locale}.json`).sort());
  for (const name of files) {
    const data = JSON.parse(readFileSync(new URL(name, dir), "utf8"));
    assert.equal(typeof data.meta?.title, "string", `${name} title`);
    assert.ok(data.meta.title.trim().length > 0, `${name} title is not empty`);
    assert.equal(typeof data.meta?.description, "string", `${name} description`);
    assert.ok(data.meta.description.trim().length > 0, `${name} description is not empty`);
  }
});

test("package.json ships the locale files and exposes them to the host", async () => {
  const { readFileSync } = await import("node:fs");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.exports["./locale/*.json"], "./locale/*.json");
  assert.ok(pkg.files.includes("locale"), "files includes locale");
});
