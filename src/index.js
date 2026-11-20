/**
 * Host half of the prompt optimizer.
 *
 * Four exact routes:
 *   GET  /prompt-optimize/models    catalog for the picker
 *   POST /prompt-optimize/optimize  one rewrite, streamed as NDJSON
 *   POST /prompt-optimize/variables extract reusable placeholders, JSON
 *   POST /prompt-optimize/review    read-only checkup with applyable fixes, JSON
 */

import { buildCatalog, currentModel } from "./catalog.js";
import { buildCustomPrompt, buildExtractionPrompt, buildPrompt, buildReviewPrompt } from "./prompts.js";
import { applyVariables, parseVariables, stripFence } from "./placeholders.js";
import { normalizeReview, parseReviewJson } from "./review.js";
import { defaultTemplateFor, getTemplate, templateMatchesMode } from "./spec.js";

export const MODELS_ROUTE = "/prompt-optimize/models";
export const OPTIMIZE_ROUTE = "/prompt-optimize/optimize";
export const VARIABLES_ROUTE = "/prompt-optimize/variables";
export const REVIEW_ROUTE = "/prompt-optimize/review";

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_TEXT_CHARS = 60_000;
const MAX_FIELD_CHARS = 200;
const MAX_VARIABLES = 5;
const MAX_TOKENS = 16_384;
/** A checkup is a small JSON object; a generous cap still bounds the cost. */
const MAX_REVIEW_TOKENS = 8_192;

/** Raised by request validation; the guard turns it into a JSON error. */
class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Read a request body with a hard byte cap.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string | null>} null when the cap was exceeded
 */
function readBounded(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      // Stop buffering, but keep draining the socket so the 413 below can still
      // be delivered: destroying the request makes the client see EPIPE instead.
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(tooLarge ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  if (res.writableEnded || res.destroyed) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendMethodNotAllowed(res, allow) {
  res.setHeader("allow", allow);
  sendJson(res, 405, { code: "method-not-allowed", message: `只支持 ${allow} 请求。` });
}

/**
 * Some models answer an editing task with {"text": "..."} even when the prompt
 * asks for plain prose. Unwrap that shape so the composer never receives JSON.
 *
 * @param {string} text
 * @returns {string}
 */
function unwrapJsonText(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return trimmed;
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return trimmed;
  for (const key of ["text", "prompt", "optimized", "result", "content", "output"]) {
    const value = parsed[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return trimmed;
}

function requireJson(req) {
  const type = String(req.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase();
  if (type !== "application/json") {
    throw new RequestError(415, "unsupported-media-type", "content-type 必须是 application/json。");
  }
}

async function readJsonBody(req) {
  const text = await readBounded(req);
  if (text === null) throw new RequestError(413, "payload-too-large", "请求体太大，已拒绝处理。");
  if (text.trim().length === 0) throw new RequestError(400, "empty-body", "请求体是空的。");
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError(400, "invalid-json", "请求体不是合法的 JSON。");
  }
}

/** Read one JSON object body; every POST route needs the same three checks. */
async function readObjectBody(req) {
  requireJson(req);
  const body = await readJsonBody(req);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new RequestError(400, "invalid-body", "请求体必须是一个 JSON 对象。");
  }
  return body;
}

function readSessionId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200 ? value : undefined;
}

function readText(value, label, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new RequestError(400, "missing-field", `缺少 ${label}。`);
    return "";
  }
  if (typeof value !== "string") throw new RequestError(400, "invalid-field", `${label} 必须是字符串。`);
  if (required && value.trim().length === 0) throw new RequestError(400, "empty-field", `${label} 不能为空。`);
  if (value.length > MAX_TEXT_CHARS) {
    throw new RequestError(413, "field-too-large", `${label} 超过 ${MAX_TEXT_CHARS} 字，已拒绝处理。`);
  }
  return value;
}

function optionalPin(body) {
  const provider = typeof body.provider === "string" ? body.provider.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (provider.length === 0 && model.length === 0) return null;
  if (provider.length === 0 || model.length === 0) {
    throw new RequestError(400, "invalid-pin", "固定模型需要同时提供 provider 与 model。");
  }
  if (provider.length > MAX_FIELD_CHARS || model.length > MAX_FIELD_CHARS) {
    throw new RequestError(400, "invalid-pin", "provider 或 model 太长。");
  }
  return { provider, model };
}

/** The model this request runs on: the pinned one, else the profile default. */
function resolveRoute(pin, ctx) {
  const route = pin ?? currentModel(ctx.agentDefaultModel);
  if (!route) {
    throw new RequestError(
      503,
      "no-model",
      "没有可用的默认模型：请在设置里选择一个默认模型，或在面板里指定模型后重试。",
    );
  }
  return route;
}

/**
 * Validate one optimize request and resolve its template.
 * @param {Record<string, unknown>} body
 */
/** A user-defined template: a label plus one rewrite instruction. */
function readCustomTemplate(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError(400, "invalid-custom-template", "customTemplate 必须是一个对象。");
  }
  const label = readText(value.label, "customTemplate.label").trim().slice(0, 60);
  const instruction = readText(value.instruction, "customTemplate.instruction", { required: true }).trim();
  if (instruction.length > 2_000) {
    throw new RequestError(400, "custom-template-too-long", "自定义要求最多 2000 字。");
  }
  return { label: label || "自定义", instruction };
}

function readOptimizeRequest(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new RequestError(400, "invalid-body", "请求体必须是一个 JSON 对象。");
  }
  const mode = body.optimizationMode;
  if (mode !== "user" && mode !== "iterate" && mode !== "system") {
    throw new RequestError(400, "invalid-mode", "optimizationMode 必须是 user、iterate 或 system。");
  }

  const targetPrompt = readText(body.targetPrompt, "targetPrompt", { required: true });
  const lastOptimizedPrompt = readText(body.lastOptimizedPrompt, "lastOptimizedPrompt");
  const iterateInput = readText(body.iterateInput, "iterateInput");
  if (mode === "iterate") {
    if (lastOptimizedPrompt.trim().length === 0) {
      throw new RequestError(400, "missing-last-prompt", "迭代优化需要上一版结果 lastOptimizedPrompt。");
    }
    if (iterateInput.trim().length === 0) {
      throw new RequestError(400, "missing-iterate-input", "迭代优化需要修改意见 iterateInput。");
    }
  }

  const custom = readCustomTemplate(body.customTemplate);
  let templateId = typeof body.templateId === "string" ? body.templateId : "";
  if (custom) {
    templateId = "custom";
  } else if (templateId.length > 0) {
    const template = getTemplate(templateId);
    if (!template) throw new RequestError(400, "unknown-template", `未知模板：${templateId}`);
    if (!templateMatchesMode(template.id, mode)) {
      throw new RequestError(400, "template-mode-mismatch", "模板与优化对象不一致：请重新选择一个匹配当前优化对象的模板。");
    }
    templateId = template.id;
  } else {
    templateId = defaultTemplateFor(mode) ?? "";
    if (templateId.length === 0) throw new RequestError(400, "no-template", "这个优化对象还没有可用模板。");
  }

  const sessionId = readSessionId(body.sessionId);

  return {
    mode,
    targetPrompt,
    lastOptimizedPrompt,
    iterateInput,
    templateId,
    custom,
    pin: optionalPin(body),
    sessionId,
  };
}

/**
 * Consume a model stream, forwarding text deltas and summarising the end.
 * @param {AsyncIterable<object>} stream
 * @param {(chunk: { type: string, text?: string }) => void} emit
 */
async function consume(stream, emit) {
  let text = "";
  let usage = null;
  let finish = null;
  for await (const chunk of stream) {
    switch (chunk?.type) {
      case "text-delta":
        if (typeof chunk.text === "string" && chunk.text.length > 0) {
          text += chunk.text;
          emit({ type: "delta", text: chunk.text });
        }
        break;
      case "usage":
        usage = chunk.usage ?? null;
        break;
      case "finish":
        finish = chunk.reason ?? null;
        break;
      default:
        break;
    }
  }
  return { text, usage, finish };
}

function finishFailure(finish) {
  if (finish?.kind === "error") {
    const detail = typeof finish.failure?.message === "string" ? finish.failure.message : "未知错误";
    return `模型调用失败：${detail}`;
  }
  if (finish?.kind === "aborted") {
    const detail = typeof finish.failure?.message === "string" ? finish.failure.message : "已中止";
    return `模型调用被中止：${detail}`;
  }
  return null;
}

/**
 * Abort the model call when the client goes away: a dropped request and a
 * closed response both mean nobody is reading the answer.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function abortOnClose(req, res) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error("client disconnected"));
  req.on("aborted", abort);
  res.on("close", abort);
  return controller;
}

/** One model call: every route sends the same envelope, only the prompt differs. */
function callModel(ctx, route, { system, user, maxTokens, sessionId, signal, emit }) {
  return consume(ctx.llm.stream({
    provider: route.provider,
    model: route.model,
    system,
    messages: [{ role: "user", content: [{ type: "text", text: user }] }],
    maxTokens,
    signal,
    ...(sessionId ? { sessionId } : {}),
  }), emit);
}

function usagePayload(usage) {
  return usage === null ? undefined : {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    ...(usage.totalTokens === undefined ? {} : { totalTokens: usage.totalTokens }),
  };
}

/**
 * Register the four routes.
 * @param {object} ctx
 */
export function apply(ctx) {
  const logger = ctx.logger;

  const guard = (label, handler) => {
    const wrapped = async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        if (res.headersSent) {
          if (!res.writableEnded && !res.destroyed) {
            try {
              res.write(`${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : String(error) })}\n`);
            } catch {
              // The socket is already gone.
            }
            res.end();
          }
          return;
        }
        const status = error instanceof RequestError
          ? error.status
          : Number.isInteger(error?.status) ? error.status : 500;
        const code = error instanceof RequestError
          ? error.code
          : typeof error?.code === "string" ? error.code : "internal-error";
        const message = status >= 500
          ? `插件内部错误：${error instanceof Error ? error.message : String(error)}`
          : error instanceof Error ? error.message : String(error);
        if (status >= 500) logger?.warn?.(`[prompt-optimize] ${label} failed: ${error?.stack ?? message}`);
        sendJson(res, status, { code, message });
      }
    };
    return wrapped;
  };

  const rejected = (req, res) => {
    if (typeof ctx.connection?.requestRejection !== "function") return false;
    const rejection = ctx.connection.requestRejection(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  };

  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: MODELS_ROUTE,
    handler: guard(`GET ${MODELS_ROUTE}`, async (req, res) => {
      if (rejected(req, res)) return;
      if (req.method !== "GET") {
        sendMethodNotAllowed(res, "GET");
        return;
      }
      const catalog = await buildCatalog({ llm: ctx.llm, defaultModel: ctx.agentDefaultModel });
      sendJson(res, 200, catalog);
    }),
  }), `prompt-optimize: GET ${MODELS_ROUTE}`);

  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: OPTIMIZE_ROUTE,
    handler: guard(`POST ${OPTIMIZE_ROUTE}`, async (req, res) => {
      if (rejected(req, res)) return;
      if (req.method !== "POST") {
        sendMethodNotAllowed(res, "POST");
        return;
      }
      const request = readOptimizeRequest(await readObjectBody(req));
      const route = resolveRoute(request.pin, ctx);

      const { system, user } = request.custom
        ? buildCustomPrompt(request.custom, {
          originalPrompt: request.targetPrompt,
          lastOptimizedPrompt: request.lastOptimizedPrompt,
          iterateInput: request.iterateInput,
        }, request.mode)
        : buildPrompt(request.templateId, {
          originalPrompt: request.targetPrompt,
          lastOptimizedPrompt: request.lastOptimizedPrompt,
          iterateInput: request.iterateInput,
        });

      const controller = abortOnClose(req, res);

      res.writeHead(200, {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store, no-transform",
        "x-accel-buffering": "no",
      });
      res.flushHeaders?.();

      const emit = (payload) => {
        if (res.destroyed || res.writableEnded) return;
        res.write(`${JSON.stringify(payload)}\n`);
      };

      let result;
      try {
        result = await callModel(ctx, route, {
          system,
          user,
          maxTokens: MAX_TOKENS,
          sessionId: request.sessionId,
          signal: controller.signal,
          emit,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          res.end();
          return;
        }
        emit({ type: "error", message: `模型调用失败：${error instanceof Error ? error.message : String(error)}` });
        res.end();
        return;
      }

      if (controller.signal.aborted) {
        res.end();
        return;
      }

      const failure = finishFailure(result.finish);
      if (failure) {
        emit({ type: "error", message: failure });
        res.end();
        return;
      }

      const text = unwrapJsonText(stripFence(result.text));
      if (text.length === 0) {
        emit({
          type: "error",
          message: `模型没有返回正文（finish=${result.finish?.kind ?? "unknown"}）。请重试，或换一个模型。`,
        });
        res.end();
        return;
      }

      emit({
        type: "done",
        text,
        model: `${route.provider}/${route.model}`,
        truncated: result.finish?.kind === "max-tokens",
        usage: usagePayload(result.usage),
      });
      res.end();
    }),
  }), `prompt-optimize: POST ${OPTIMIZE_ROUTE}`);

  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: VARIABLES_ROUTE,
    handler: guard(`POST ${VARIABLES_ROUTE}`, async (req, res) => {
      if (rejected(req, res)) return;
      if (req.method !== "POST") {
        sendMethodNotAllowed(res, "POST");
        return;
      }
      const body = await readObjectBody(req);
      const promptContent = readText(body.promptContent, "promptContent", { required: true });
      const existingNames = Array.isArray(body.existingVariableNames)
        ? body.existingVariableNames
          .filter((name) => typeof name === "string" && name.trim().length > 0)
          .map((name) => name.trim())
          .slice(0, 50)
        : [];

      const route = resolveRoute(optionalPin(body), ctx);

      const { system, user } = buildExtractionPrompt({ promptContent, existingNames });
      const controller = abortOnClose(req, res);

      const result = await callModel(ctx, route, {
        system,
        user,
        maxTokens: MAX_TOKENS,
        sessionId: readSessionId(body.sessionId),
        signal: controller.signal,
        emit: () => {},
      });

      if (controller.signal.aborted) throw new RequestError(499, "aborted", "抽取被中止。");
      const failure = finishFailure(result.finish);
      if (failure) throw new RequestError(502, "model-failure", failure);

      const parsed = parseVariables(result.text);
      let templated = null;
      let templatedError;
      try {
        templated = applyVariables(promptContent, parsed.variables).templated;
      } catch (error) {
        templatedError = error instanceof Error ? error.message : String(error);
      }

      sendJson(res, 200, {
        variables: parsed.variables.slice(0, MAX_VARIABLES),
        summary: parsed.summary,
        templated,
        ...(templatedError === undefined ? {} : { templatedError }),
        model: `${route.provider}/${route.model}`,
      });
    }),
  }), `prompt-optimize: POST ${VARIABLES_ROUTE}`);

  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: REVIEW_ROUTE,
    handler: guard(`POST ${REVIEW_ROUTE}`, async (req, res) => {
      if (rejected(req, res)) return;
      if (req.method !== "POST") {
        sendMethodNotAllowed(res, "POST");
        return;
      }
      const body = await readObjectBody(req);
      const promptContent = readText(body.promptContent, "promptContent", { required: true });

      const route = resolveRoute(optionalPin(body), ctx);

      const { system, user } = buildReviewPrompt({ promptContent });
      const controller = abortOnClose(req, res);

      const result = await callModel(ctx, route, {
        system,
        user,
        maxTokens: MAX_REVIEW_TOKENS,
        sessionId: readSessionId(body.sessionId),
        signal: controller.signal,
        emit: () => {},
      });

      if (controller.signal.aborted) throw new RequestError(499, "aborted", "体检被中止。");
      const failure = finishFailure(result.finish);
      if (failure) throw new RequestError(502, "model-failure", failure);

      let review;
      try {
        review = normalizeReview(parseReviewJson(result.text), promptContent);
      } catch (error) {
        throw new RequestError(
          502,
          "invalid-review",
          `模型返回的体检结果无法解析：${error instanceof Error ? error.message : String(error)}`,
        );
      }

      sendJson(res, 200, {
        ...review,
        model: `${route.provider}/${route.model}`,
        usage: usagePayload(result.usage),
      });
    }),
  }), `prompt-optimize: POST ${REVIEW_ROUTE}`);
}

export const name = "prompt-optimize";
export const inject = ["webServer", "connection", "llm", "agentDefaultModel"];
