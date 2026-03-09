import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpecTransmuteResult } from './buildSpecTransmuteResult.js';

const fieldMap = {
  summary: 'summary',
  problemFrame: 'problem_frame',
  who: 'who',
  when: 'when',
  what: 'what',
  why: 'why',
  success: 'success',
  roles: 'roles',
  role: 'role',
  description: 'description',
  features: 'features',
  must: 'must',
  nice: 'nice',
  inputFields: 'input_fields',
  name: 'name',
  type: 'type',
  example: 'example',
  permissions: 'permissions',
  read: 'read',
  create: 'create',
  update: 'update',
  delete: 'delete',
  notes: 'notes',
  ambiguities: 'ambiguities',
  missing: 'missing',
  questions: 'questions',
  risks: 'risks',
};

test('buildSpecTransmuteResult keeps the current spec result envelope stable while preparing intent IR', () => {
  const spec = {
    summary: 'Store export report',
    problem_frame: {
      who: 'store manager',
      when: 'end of day',
      what: 'review order volume',
      why: 'spot issues quickly',
      success: 'export works in one click',
    },
    roles: [],
    features: { must: [], nice: [] },
    input_fields: [],
    permissions: [],
    ambiguities: { missing: [], questions: [] },
    risks: [],
  };
  const validationReport = {
    severity: 'low',
    needs_clarification: false,
    warning_count: 0,
    blocking_issue_count: 0,
  };

  const { result, intentIr } = buildSpecTransmuteResult({
    raw: {
      model: 'demo-model',
      meta: { source: 'raw' },
      layers: { L1_thinking: { notes: ['kept'] } },
    },
    fallbackModel: 'fallback-model',
    promptMeta: { experiment: 'v1' },
    sourceVibe: 'Need a store report',
    standardOutputAliasKey: 'legacy_output',
    intentFieldMap: fieldMap,
    normalizeStandardOutput: () => ({ spec, validationReport }),
    renderer: {
      buildResultSections: (_spec, rawThinking) => ({
        artifacts: { dev_spec_md: 'dev', nondev_spec_md: 'nondev', master_prompt: 'master' },
        layers: { L1_thinking: rawThinking },
        glossary: ['glossary'],
      }),
    },
  });

  assert.equal(result.model, 'demo-model');
  assert.equal(result.standard_output, spec);
  assert.equal(result.legacy_output, spec);
  assert.deepEqual(result.artifacts, { dev_spec_md: 'dev', nondev_spec_md: 'nondev', master_prompt: 'master' });
  assert.deepEqual(result.layers, { L1_thinking: { notes: ['kept'] } });
  assert.deepEqual(result.glossary, ['glossary']);
  assert.deepEqual(result.meta, { source: 'raw', experiment: 'v1' });
  assert.equal(intentIr.intent.user_job, 'review order volume');
});
