import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import { OPTIMIZE_ROUTE, apply } from "../src/index.js";

/** Register the plugin against a stub host and hand back its route handlers. */
function createHost() {
  const handlers = new Map();
  apply({
    logger: { warn() {} },
    connection: { requestRejection: () => undefined },
    webServer: {
      register: ({ path, handler }) => {
        handlers.set(path, handler);
        return () => {};
      },
    },
    effect: (register) => {
      register();
    },
    llm: { listProviders: () => [], listModels: async () => [], stream: async function* () {} },
    agentDefaultModel: { currentSelection: () => null },
  });
  return handlers;
}

async function withServer(handlers, run) {
  const server = http.createServer((req, res) => handlers.get(req.url)(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

test("a body over the cap is refused with 413, not a dropped socket", async () => {
  const handlers = createHost();
  await withServer(handlers, async (base) => {
    const response = await fetch(`${base}${OPTIMIZE_ROUTE}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(1024 * 1024 + 16),
    });
    assert.equal(response.status, 413);
    assert.match((await response.json()).message, /请求体太大/);
  });
});

test("the optimize route rejects a non-JSON content type before reading the body", async () => {
  const handlers = createHost();
  await withServer(handlers, async (base) => {
    const response = await fetch(`${base}${OPTIMIZE_ROUTE}`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    assert.equal(response.status, 415);
  });
});
