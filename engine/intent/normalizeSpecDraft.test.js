import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSpecDraft } from './normalizeSpecDraft.js';

const K = {
  SUMMARY: 'summary',
  PROBLEM_FRAME: 'problem_frame',
  WHO: 'who',
  WHEN: 'when',
  WHAT: 'what',
  WHY: 'why',
  SUCCESS: 'success',
  INTERVIEW: 'interview',
  ROLES: 'roles',
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
  ROLE: 'role',
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
  REQUEST_CONVERTER: 'request_converter',
  RAW_REQUEST: 'raw',
  SHORT_REQUEST: 'short',
  STANDARD_REQUEST: 'standard',
  DETAILED_REQUEST: 'detailed',
  IMPACT: 'impact',
  IMPACT_SCREENS: 'screens',
  IMPACT_PERMISSIONS: 'impact_permissions',
  IMPACT_TESTS: 'impact_tests',
  LAYER_GUIDE: 'layer_guide',
  COMPLETENESS: 'completeness',
};

test('normalizeSpecDraft separates raw-to-spec draft normalization from analysis handoff inputs', () => {
  const layerGuideInput = [{ layer: 'L1', goal: 'Understand the problem', output: 'Problem frame' }];
  const raw = {
    one_line_summary: 'Store report assistant',
    problem_frame: {
      who: 'store manager',
      when: 'end of day',
      what: 'review daily order volume',
      why: 'spot issues quickly',
      success_criteria: 'exports in one click',
    },
    interview_mode: {
      follow_up_questions: ['Which stores are included?'],
    },
    users_and_roles: [
      { role: 'manager', description: 'reviews reports' },
      { role: '', description: '' },
    ],
    core_features: {
      must: ['Generate a report'],
      nice_to_have: ['Email the report'],
    },
    user_flow_steps: ['Open report', 'Pick range'],
    input_fields: [
      { name: 'date_range', type: 'string', example: '2026-03-09' },
      { name: '', type: '', example: '' },
    ],
    permission_matrix: [
      { role: 'manager', read: true, create: false, update: '가능', delete: 0, notes: 'export only' },
      { role: '', notes: '' },
    ],
    ambiguities: {
      missing_information: ['timezone'],
      questions: ['Which timezone should exports use?'],
    },
    risks: ['Large CSV downloads'],
    test_scenarios: ['Loads report'],
    next_steps_today: ['Define export format'],
    request_converter: {
      original: 'Build the reporting workflow',
      standard: 'Implement the report workflow.',
    },
    impact_preview: {
      screens: ['Report screen'],
      permissions: ['Manager export permission'],
      tests: ['CSV export regression'],
    },
    layer_guide: layerGuideInput,
    completeness: {
      score: 91,
      warnings: ['Timezone is not fixed'],
    },
  };

  const { specDraft, analysisHandoff } = normalizeSpecDraft({
    schemaKeys: K,
    raw,
    normalizeLayerGuide: (value) => value,
  });

  assert.equal(specDraft.summary, 'Store report assistant');
  assert.deepEqual(specDraft.problem_frame, {
    who: 'store manager',
    when: 'end of day',
    what: 'review daily order volume',
    why: 'spot issues quickly',
    success: 'exports in one click',
  });
  assert.deepEqual(specDraft.roles, [
    { role: 'manager', description: 'reviews reports' },
  ]);
  assert.deepEqual(specDraft.features, {
    must: ['Generate a report'],
    nice: ['Email the report'],
  });
  assert.deepEqual(specDraft.flow, [
    'Open report',
    'Pick range',
    '사용자 흐름 단계 3',
    '사용자 흐름 단계 4',
    '사용자 흐름 단계 5',
  ]);
  assert.deepEqual(specDraft.input_fields, [
    { name: 'date_range', type: 'string', example: '2026-03-09' },
  ]);
  assert.deepEqual(specDraft.permissions, [
    { role: 'manager', read: true, create: false, update: true, delete: false, notes: 'export only' },
  ]);
  assert.deepEqual(specDraft.ambiguities, {
    missing: ['timezone'],
    questions: ['Which timezone should exports use?', '확인 질문 2', '확인 질문 3'],
  });
  assert.deepEqual(specDraft.risks, ['Large CSV downloads', '리스크 2', '리스크 3']);
  assert.deepEqual(specDraft.tests, ['Loads report', '테스트 시나리오 2', '테스트 시나리오 3']);
  assert.deepEqual(specDraft.next, ['Define export format', '오늘 할 일 2', '오늘 할 일 3']);
  assert.deepEqual(specDraft.request_converter, {
    raw: 'Build the reporting workflow',
    short: '',
    standard: 'Implement the report workflow.',
    detailed: '',
  });
  assert.deepEqual(specDraft.impact, {
    screens: ['Report screen'],
    impact_permissions: ['Manager export permission'],
    impact_tests: ['CSV export regression'],
  });
  assert.equal(specDraft.layer_guide, layerGuideInput);

  assert.deepEqual(analysisHandoff.interviewSource, raw.interview_mode);
  assert.deepEqual(analysisHandoff.ambiguitiesSource, raw.ambiguities);
  assert.deepEqual(analysisHandoff.completenessSource, raw.completeness);
});

test('normalizeSpecDraft keeps fallback-filled spec assembly separate from missing analysis sources', () => {
  const { specDraft, analysisHandoff } = normalizeSpecDraft({
    schemaKeys: K,
    raw: {},
    normalizeLayerGuide: () => ['default layer guide'],
  });

  assert.equal(specDraft.summary, '요약 정보가 필요합니다.');
  assert.deepEqual(specDraft.problem_frame, {
    who: '주요 사용자 정의 필요',
    when: '사용 시점 정의 필요',
    what: '해결할 작업 정의 필요',
    why: '문제 배경 정의 필요',
    success: '성공 기준 정의 필요',
  });
  assert.equal(specDraft.flow.length, 5);
  assert.equal(specDraft.risks.length, 3);
  assert.equal(specDraft.tests.length, 3);
  assert.equal(specDraft.next.length, 3);
  assert.deepEqual(specDraft.layer_guide, ['default layer guide']);
  assert.deepEqual(analysisHandoff, {
    interviewSource: {},
    ambiguitiesSource: {},
    completenessSource: {},
  });
});
