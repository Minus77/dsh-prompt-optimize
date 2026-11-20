/**
 * Build the browser-facing catalog: which models can be pinned, which
 * templates exist, and which one each mode starts on.
 */

import { MODES, catalogTemplates, DEFAULT_TEMPLATE } from "./spec.js";

/**
 * Read the profile's default model without letting a missing service throw.
 * @param {{ currentSelection?: () => { provider?: unknown, model?: unknown } }} service
 * @returns {{ provider: string, model: string } | null}
 */
export function currentModel(service) {
  try {
    const selection = service?.currentSelection?.();
    if (selection && typeof selection.provider === "string" && typeof selection.model === "string"
      && selection.provider.length > 0 && selection.model.length > 0) {
      return { provider: selection.provider, model: selection.model };
    }
  } catch {
    // An unconfigured profile is a normal state, not an error worth surfacing.
  }
  return null;
}

/**
 * Enumerate provider groups. One provider that cannot answer is skipped so a
 * single broken adapter does not empty the picker.
 * @param {{ listProviders?: () => Array<{ id: string, name?: string }>, listModels?: (provider: string) => Promise<Array<{ id: string, name?: string }>> }} llm
 */
async function readGroups(llm) {
  const providers = typeof llm?.listProviders === "function" ? llm.listProviders() : [];
  const groups = [];
  for (const provider of providers) {
    if (!provider || typeof provider.id !== "string") continue;
    try {
      const models = await llm.listModels(provider.id);
      groups.push({
        provider: provider.id,
        name: typeof provider.name === "string" && provider.name.length > 0 ? provider.name : provider.id,
        models: (Array.isArray(models) ? models : [])
          .filter((model) => model && typeof model.id === "string" && model.id.length > 0)
          .map((model) => ({ id: model.id, name: typeof model.name === "string" && model.name.length > 0 ? model.name : model.id })),
      });
    } catch {
      // Skip this provider only.
    }
  }
  return groups;
}

/**
 * @param {object} deps
 * @param {object} deps.llm
 * @param {object} [deps.defaultModel]
 * @returns {Promise<object>}
 */
export async function buildCatalog({ llm, defaultModel }) {
  const [current, groups] = [currentModel(defaultModel), await readGroups(llm)];
  return {
    current,
    groups,
    modes: MODES.map((mode) => ({ ...mode })),
    templates: catalogTemplates(),
    defaults: { ...DEFAULT_TEMPLATE },
    extraction: true,
  };
}
