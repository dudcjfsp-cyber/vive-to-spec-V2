import test from 'node:test';
import assert from 'node:assert/strict';
import { executeStructuredGeneration } from './executeStructuredGeneration.js';

test('executeStructuredGeneration applies strict_format then semantic_repair as a reusable stage handoff', async () => {
  const attemptOptions = [];
  const promptMeta = { experiment: 'reuse' };
  const parsedOutputs = [
    { stage: 'initial' },
    { stage: 'strict' },
    { stage: 'semantic' },
  ];
  const semanticHandoffs = [
    { issues: ['Fill problem frame'], issueCount: 1, hasIssues: true },
    { issues: ['Fill must-have feature'], issueCount: 1, hasIssues: true },
    { issues: [], issueCount: 0, hasIssues: false },
  ];
  const repairContexts = [];

  const result = await executeStructuredGeneration({
    promptOptions: {
      vibe: 'daily report',
      policyMode: 'baseline',
    },
    shouldUseAdvancedRepairs: true,
    runPromptAttempt: async (options) => {
      attemptOptions.push(options);
      return {
        parsed: parsedOutputs.shift(),
        parseRepairUsed: false,
        promptMeta,
      };
    },
    collectSemanticHandoff: () => semanticHandoffs.shift(),
    createSemanticRepairContext: (handoff, previousOutput) => {
      const context = {
        mode: 'semantic_repair',
        issues: handoff.issues,
        previousOutput,
      };
      repairContexts.push(context);
      return context;
    },
  });

  assert.equal(attemptOptions.length, 3);
  assert.equal(attemptOptions[0].policyMode, 'baseline');
  assert.equal(attemptOptions[1].policyMode, 'strict_format');
  assert.equal(attemptOptions[2].policyMode, 'semantic_repair');
  assert.deepEqual(repairContexts, [{
    mode: 'semantic_repair',
    issues: ['Fill must-have feature'],
    previousOutput: { stage: 'strict' },
  }]);
  assert.deepEqual(result, {
    parsed: { stage: 'semantic' },
    promptMeta,
    repairMode: 'semantic_repair',
    fallbackApplied: true,
    validationRetryCount: 2,
    semanticIssueCount: 0,
  });
});

test('executeStructuredGeneration skips advanced repairs when disabled and preserves JSON-repair metadata', async () => {
  const attemptOptions = [];

  const result = await executeStructuredGeneration({
    promptOptions: {
      vibe: 'quick note',
      policyMode: 'baseline',
    },
    shouldUseAdvancedRepairs: false,
    runPromptAttempt: async (options) => {
      attemptOptions.push(options);
      return {
        parsed: { ok: true },
        parseRepairUsed: true,
        promptMeta: null,
      };
    },
    collectSemanticHandoff: () => ({
      issues: ['Still thin'],
      issueCount: 1,
      hasIssues: true,
    }),
  });

  assert.equal(attemptOptions.length, 1);
  assert.deepEqual(result, {
    parsed: { ok: true },
    promptMeta: null,
    repairMode: 'json_repair',
    fallbackApplied: true,
    validationRetryCount: 0,
    semanticIssueCount: 1,
  });
});

test('executeStructuredGeneration jumps directly to semantic repair when already in strict_format mode', async () => {
  const attemptOptions = [];

  const result = await executeStructuredGeneration({
    promptOptions: {
      vibe: 'inventory',
      policyMode: 'strict_format',
    },
    shouldUseAdvancedRepairs: true,
    runPromptAttempt: async (options) => {
      attemptOptions.push(options);
      return {
        parsed: { stage: attemptOptions.length },
        parseRepairUsed: false,
        promptMeta: { id: 'stage' },
      };
    },
    collectSemanticHandoff: (() => {
      const handoffs = [
        { issues: ['Need success criteria'], issueCount: 1, hasIssues: true },
        { issues: [], issueCount: 0, hasIssues: false },
      ];
      return () => handoffs.shift();
    })(),
    createSemanticRepairContext: (handoff, previousOutput) => ({
      mode: 'semantic_repair',
      issues: handoff.issues,
      previousOutput,
    }),
  });

  assert.equal(attemptOptions.length, 2);
  assert.equal(attemptOptions[0].policyMode, 'strict_format');
  assert.equal(attemptOptions[1].policyMode, 'semantic_repair');
  assert.equal(result.repairMode, 'semantic_repair');
  assert.equal(result.validationRetryCount, 1);
});
