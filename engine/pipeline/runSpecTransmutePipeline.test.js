import test from 'node:test';
import assert from 'node:assert/strict';
import { runSpecTransmutePipeline } from './runSpecTransmutePipeline.js';

test('runSpecTransmutePipeline keeps the public result envelope stable', async () => {
  const result = await runSpecTransmutePipeline({
    generateText: async () => '',
    promptOptions: { vibe: 'Need report' },
    selectedModel: 'demo-model',
    normalizedProvider: 'gemini',
    sourceVibe: 'Need report',
    executePromptRepairChain: async () => ({
      parsed: { ok: true },
      promptMeta: { experiment: 'v1' },
      repairMode: 'none',
      fallbackApplied: false,
      validationRetryCount: 0,
      semanticIssueCount: 0,
    }),
    normalizeResult: (parsed, selectedModel, promptMeta, sourceVibe) => ({
      parsed,
      selectedModel,
      promptMeta,
      sourceVibe,
    }),
  });

  assert.deepEqual(result, {
    parsed: { ok: true },
    selectedModel: 'demo-model',
    promptMeta: {
      experiment: 'v1',
      repair_mode: 'none',
      fallback_applied: false,
      validation_retry_count: 0,
      semantic_issue_count: 0,
    },
    sourceVibe: 'Need report',
    provider: 'gemini',
  });
});
