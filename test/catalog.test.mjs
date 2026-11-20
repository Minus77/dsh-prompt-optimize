import assert from "node:assert/strict";
import test from "node:test";

import { currentModel } from "../src/catalog.js";

test("currentModel reads the profile's default selection", () => {
  const service = { currentSelection: () => ({ provider: "acme", model: "m-1" }) };
  assert.deepEqual(currentModel(service), { provider: "acme", model: "m-1" });
});

test("currentModel treats a missing, partial or throwing service as no model", () => {
  assert.equal(currentModel(undefined), null);
  assert.equal(currentModel({ currentSelection: () => ({ provider: "acme" }) }), null);
  assert.equal(currentModel({ currentSelection: () => ({ provider: "", model: "m-1" }) }), null);
  assert.equal(currentModel({ currentSelection: () => { throw new Error("unconfigured"); } }), null);
});
