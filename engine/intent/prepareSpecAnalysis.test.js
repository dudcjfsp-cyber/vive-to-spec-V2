import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSpecAnalysis } from './prepareSpecAnalysis.js';

const K = {
  SUMMARY: 'summary',
  PROBLEM_FRAME: 'problem_frame',
  WHO: 'who',
  WHAT: 'what',
  SUCCESS: 'success',
  FEATURES: 'features',
  MUST: 'must',
  FLOW: 'flow',
  TESTS: 'tests',
  INTERVIEW: 'interview',
  FOLLOW_UP: 'follow_up',
  AMBIGUITIES: 'ambiguities',
  MISSING: 'missing',
  QUESTIONS: 'questions',
  REQUEST_CONVERTER: 'request_converter',
  RAW_REQUEST: 'raw',
  SHORT_REQUEST: 'short',
  STANDARD_REQUEST: 'standard',
  DETAILED_REQUEST: 'detailed',
  IMPACT: 'impact',
  IMPACT_SCREENS: 'screens',
  IMPACT_PERMISSIONS: 'permissions',
  IMPACT_TESTS: 'impact_tests',
  PERMISSIONS: 'permissions_matrix',
  ROLE: 'role',
  COMPLETENESS: 'completeness',
  SCORE: 'score',
  WARNINGS: 'warnings',
};

test('prepareSpecAnalysis derives analysis-friendly fallbacks from a normalized spec draft', () => {
  const spec = {
    summary: 'Store report assistant',
    problem_frame: {
      who: 'store manager',
      what: 'review daily order volume',
      success: 'export works in one click',
    },
    features: {
      must: ['Generate a report'],
    },
    flow: ['Open report', 'Pick range', 'Review totals', 'Export CSV', 'Share results'],
    tests: ['Loads report', 'Exports CSV', 'Shows permission error'],
    permissions_matrix: [
      { role: 'manager' },
    ],
    request_converter: {
      raw: 'Create the reporting workflow',
      short: '',
      standard: '',
      detailed: '',
    },
    impact: {
      screens: [],
      permissions: [],
      impact_tests: [],
    },
  };

  const prepared = prepareSpecAnalysis({
    schemaKeys: K,
    spec,
    interviewSource: {},
    ambiguitiesSource: {
      missing: ['timezone'],
      questions: ['Which timezone should the export use?'],
    },
    completenessSource: {
      score: 92,
      warnings: ['Timezone is not fixed'],
    },
  });

  assert.deepEqual(prepared.interviewMode, {
    follow_up: [
      'Which timezone should the export use?',
      'timezone 항목을 어떻게 확정할까요?',
      '필수 입력 데이터(예: 업체명, 제품명, 수량) 중 절대 누락되면 안 되는 항목은 무엇인가요?',
    ],
  });
  assert.equal(prepared.requestConverter.raw, 'Create the reporting workflow');
  assert.equal(prepared.requestConverter.short, 'Generate a report 기능을 오늘 구현해주세요.');
  assert.match(prepared.requestConverter.standard, /Store report assistant/);
  assert.match(prepared.requestConverter.detailed, /우선 구현: Generate a report/);
  assert.deepEqual(prepared.impact.screens, [
    'Open report 화면 영향 가능',
    'Pick range 화면 영향 가능',
    'Review totals 화면 영향 가능',
    'Export CSV 화면 영향 가능',
    'Share results 화면 영향 가능',
  ]);
  assert.deepEqual(prepared.impact.permissions, ['manager 권한 검토 필요']);
  assert.deepEqual(prepared.impact.impact_tests, [
    'Loads report 검증 케이스 영향',
    'Exports CSV 검증 케이스 영향',
    'Shows permission error 검증 케이스 영향',
  ]);
  assert.deepEqual(prepared.completenessInput, {
    score: 92,
    warnings: ['Timezone is not fixed'],
  });
});

test('prepareSpecAnalysis preserves provided analysis-facing content when already present', () => {
  const prepared = prepareSpecAnalysis({
    schemaKeys: K,
    spec: {
      summary: 'Keep provided values',
      problem_frame: {
        who: 'manager',
        what: 'approve requests',
        success: 'approval is saved',
      },
      features: {
        must: ['Approve request'],
      },
      flow: ['A', 'B', 'C', 'D', 'E'],
      tests: ['A', 'B', 'C'],
      permissions_matrix: [],
      request_converter: {
        raw: 'Original request',
        short: 'Provided short',
        standard: 'Provided standard',
        detailed: 'Provided detailed',
      },
      impact: {
        screens: ['Provided screen impact'],
        permissions: ['Provided permission impact'],
        impact_tests: ['Provided test impact'],
      },
    },
    interviewSource: {
      follow_up: ['Provided interview question', 'Second question', 'Third question'],
    },
    ambiguitiesSource: {},
    completenessSource: {},
  });

  assert.deepEqual(prepared.interviewMode.follow_up, [
    'Provided interview question',
    'Second question',
    'Third question',
  ]);
  assert.deepEqual(prepared.requestConverter, {
    raw: 'Original request',
    short: 'Provided short',
    standard: 'Provided standard',
    detailed: 'Provided detailed',
  });
  assert.deepEqual(prepared.impact, {
    screens: ['Provided screen impact'],
    permissions: ['Provided permission impact'],
    impact_tests: ['Provided test impact'],
  });
  assert.deepEqual(prepared.completenessInput, {
    score: null,
    warnings: [],
  });
});

test('prepareSpecAnalysis deduplicates interview candidates and pads to exactly three questions', () => {
  const prepared = prepareSpecAnalysis({
    schemaKeys: K,
    spec: {
      summary: 'Need clarification',
      problem_frame: {
        who: '',
        what: '',
        success: '',
      },
      features: { must: [] },
      flow: [],
      tests: [],
      permissions_matrix: [],
      request_converter: {},
      impact: {},
    },
    interviewSource: {
      follow_up: ['same question', 'same question'],
    },
    ambiguitiesSource: {
      questions: ['same question'],
      missing: ['deployment target'],
    },
    completenessSource: {},
  });

  assert.equal(prepared.interviewMode.follow_up.length, 3);
  assert.equal(prepared.interviewMode.follow_up[0], 'same question');
  assert.match(prepared.interviewMode.follow_up[1], /deployment target/);
  assert.equal(typeof prepared.interviewMode.follow_up[2], 'string');
  assert.equal(prepared.interviewMode.follow_up[2].length > 0, true);
});

test('prepareSpecAnalysis falls back to summary and default permission impact when source data is thin', () => {
  const prepared = prepareSpecAnalysis({
    schemaKeys: K,
    spec: {
      summary: 'Thin draft',
      problem_frame: {
        who: 'manager',
        what: 'review data',
        success: 'can finish review',
      },
      features: { must: [] },
      flow: [],
      tests: [],
      permissions_matrix: [],
      request_converter: {},
      impact: {},
    },
    interviewSource: {},
    ambiguitiesSource: {},
    completenessSource: {
      score: 999,
      warnings: ['  ', 'Need access policy'],
    },
  });

  assert.equal(prepared.requestConverter.raw, 'Thin draft');
  assert.equal(prepared.impact.permissions.length, 1);
  assert.match(prepared.impact.permissions[0], /CRUD/);
  assert.deepEqual(prepared.completenessInput, {
    score: 100,
    warnings: ['Need access policy'],
  });
});

