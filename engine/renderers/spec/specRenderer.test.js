import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpecRenderer } from './specRenderer.js';

const K = {
  SUMMARY: 'summary',
  ROLES: 'roles',
  ROLE: 'role',
  DESCRIPTION: 'description',
  FEATURES: 'features',
  MUST: 'must',
  NICE: 'nice',
  FLOW: 'flow',
  INPUT_FIELDS: 'input_fields',
  NAME: 'name',
  TYPE: 'type',
  EXAMPLE: 'example',
  PERMISSIONS: 'permissions',
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  NOTES: 'notes',
  AMBIGUITIES: 'ambiguities',
  MISSING: 'missing',
  QUESTIONS: 'questions',
  RISKS: 'risks',
  TESTS: 'tests',
  NEXT: 'next',
  PROBLEM_FRAME: 'problem_frame',
  WHO: 'who',
  WHEN: 'when',
  WHAT: 'what',
  WHY: 'why',
  SUCCESS: 'success',
  REQUEST_CONVERTER: 'request_converter',
  STANDARD_REQUEST: 'standard',
  DETAILED_REQUEST: 'detailed',
  IMPACT: 'impact',
  IMPACT_SCREENS: 'screens',
  IMPACT_PERMISSIONS: 'permissions',
  IMPACT_TESTS: 'tests',
  COMPLETENESS: 'completeness',
  SCORE: 'score',
  WARNINGS: 'warnings',
};

function createSpec() {
  return {
    summary: 'Store report assistant',
    problem_frame: {
      who: 'store manager',
      when: 'end of day',
      what: 'review order volume',
      why: 'spot issues quickly',
      success: 'export works in one click',
    },
    roles: [{ role: 'manager', description: 'reviews the report' }],
    features: { must: ['Generate a report'], nice: ['Send a daily summary'] },
    flow: ['Open report', 'Pick range', 'Review totals', 'Export CSV', 'Share results'],
    input_fields: [{ name: 'date_range', type: 'string', example: '2026-03-09' }],
    permissions: [{ role: 'manager', read: true, create: false, update: false, delete: false, notes: 'read only' }],
    ambiguities: { missing: ['timezone'], questions: ['Which timezone should the export use?'] },
    risks: ['Incorrect timezone'],
    tests: ['Loads report', 'Exports CSV', 'Shows permission error'],
    next: ['Define timezone', 'Confirm export format', 'Validate permissions'],
    request_converter: {
      standard: 'Implement the report workflow.',
      detailed: 'Implement the report workflow with export validation.',
    },
    impact: {
      screens: ['Report screen'],
      permissions: ['Manager read access'],
      tests: ['CSV export test'],
    },
    completeness: {
      score: 88,
      warnings: ['Timezone is missing'],
    },
  };
}

test('createSpecRenderer builds stable result sections for the spec app', () => {
  const renderer = createSpecRenderer({ schemaKeys: K });
  const sections = renderer.buildResultSections(createSpec(), {
    interpretation: 'Summarized report workflow',
    assumptions: ['Manager is the only user'],
    uncertainties: ['Timezone'],
    alternatives: [],
  });

  assert.deepEqual(Object.keys(sections), ['artifacts', 'layers', 'glossary']);
  assert.equal(typeof sections.artifacts.dev_spec_md, 'string');
  assert.equal(typeof sections.artifacts.nondev_spec_md, 'string');
  assert.equal(typeof sections.artifacts.master_prompt, 'string');
  assert.equal(sections.layers.L1_thinking.interpretation, 'Summarized report workflow');
  assert.equal(Array.isArray(sections.glossary), true);
  assert.equal(sections.glossary.length > 0, true);
});
