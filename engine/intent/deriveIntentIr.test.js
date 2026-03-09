import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIntentIrFromSpec } from './deriveIntentIr.js';

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

test('buildIntentIrFromSpec derives a renderer-neutral view from normalized spec data', () => {
  const intentIr = buildIntentIrFromSpec({
    sourceVibe: 'Need a store report',
    spec: {
      summary: 'Store export report',
      problem_frame: {
        who: 'store manager',
        when: 'end of day',
        what: 'review order volume',
        why: 'spot issues quickly',
        success: 'export works in one click',
      },
      roles: [{ role: 'manager', description: 'reviews output' }],
      features: { must: ['Generate CSV'], nice: ['Email summary'] },
      input_fields: [{ name: 'date_range', type: 'string', example: '2026-03-09' }],
      permissions: [{ role: 'manager', read: true, create: false, update: false, delete: false, notes: 'read only' }],
      ambiguities: {
        missing: ['exact export format'],
        questions: ['Should export support CSV only?'],
      },
      risks: ['stale data'],
    },
    validationReport: {
      needs_clarification: true,
      severity: 'medium',
      warning_count: 1,
      blocking_issue_count: 0,
    },
    fields: fieldMap,
  });

  assert.equal(intentIr.source_vibe, 'Need a store report');
  assert.equal(intentIr.summary, 'Store export report');
  assert.equal(intentIr.intent.target_user, 'store manager');
  assert.deepEqual(intentIr.delivery.must_haves, ['Generate CSV']);
  assert.deepEqual(intentIr.analysis.missing_information, ['exact export format']);
  assert.equal(intentIr.signals.confidence, 'medium');
});
