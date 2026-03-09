import { buildIntentIrFromSpec } from '../intent/deriveIntentIr.js';

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function buildSpecTransmuteResult({
  raw,
  fallbackModel,
  promptMeta = null,
  sourceVibe = '',
  standardOutputAliasKey = '',
  intentFieldMap = {},
  normalizeStandardOutput,
  renderer,
} = {}) {
  if (typeof normalizeStandardOutput !== 'function') {
    throw new Error('normalizeStandardOutput is required.');
  }
  if (!isPlainObject(renderer) || typeof renderer.buildResultSections !== 'function') {
    throw new Error('renderer.buildResultSections is required.');
  }

  const safe = isPlainObject(raw) ? raw : {};
  const { spec, validationReport } = normalizeStandardOutput(safe);
  const rawThinking = isPlainObject(safe.layers?.L1_thinking)
    ? safe.layers.L1_thinking
    : (isPlainObject(safe.L1_thinking) ? safe.L1_thinking : null);
  const rendered = renderer.buildResultSections(spec, rawThinking);
  const mergedMeta = {
    ...(isPlainObject(safe.meta) ? safe.meta : {}),
    ...(isPlainObject(promptMeta) ? promptMeta : {}),
  };

  const intentIr = buildIntentIrFromSpec({
    sourceVibe,
    spec,
    validationReport,
    fields: intentFieldMap,
  });

  const result = {
    model: typeof safe.model === 'string' && safe.model.trim() ? safe.model : fallbackModel,
    standard_output: spec,
    validation_report: validationReport,
    artifacts: rendered.artifacts,
    layers: rendered.layers,
    glossary: rendered.glossary,
  };

  if (standardOutputAliasKey) {
    result[standardOutputAliasKey] = spec;
  }

  if (Object.keys(mergedMeta).length > 0) {
    result.meta = mergedMeta;
  }

  return {
    result,
    intentIr,
  };
}
