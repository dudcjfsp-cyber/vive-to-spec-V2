import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSemanticRepairIssues } from './semanticRepairIssues.js';

const SPEC_SCHEMA_KEYS = {
  PROBLEM_FRAME: '문제정의_5칸',
  WHO: '누가',
  WHAT: '무엇을',
  SUCCESS: '성공기준',
  ROLES: '사용자_역할',
  FEATURES: '핵심_기능',
  MUST: '필수',
  INPUT_FIELDS: '입력_데이터_필드',
  PERMISSIONS: '권한_규칙',
  TESTS: '테스트_시나리오_3개',
  REQUEST_CONVERTER: '수정요청_변환',
  STANDARD_REQUEST: '표준_요청',
};

test('collectSemanticRepairIssues reads spec-schema keys when provided', () => {
  const issues = collectSemanticRepairIssues({
    문제정의_5칸: {
      누가: '운영 매니저',
      무엇을: '주문 현황을 검토한다',
      성공기준: '엑셀 내보내기를 수동 정리 없이 끝낸다',
    },
    사용자_역할: [
      { 역할: 'manager', 설명: '결과를 검토한다' },
    ],
    핵심_기능: {
      필수: ['리포트를 생성한다'],
    },
    입력_데이터_필드: [
      { 이름: 'date_range', 타입: 'string' },
    ],
    권한_규칙: [
      { 역할: 'manager', 조회: true, 생성: false, 수정: false, 삭제: false },
    ],
    테스트_시나리오_3개: ['리포트가 열린다', '기간 필터가 동작한다', 'CSV를 내보낸다'],
    수정요청_변환: {
      표준_요청: '리포트 워크플로를 구현해주세요.',
    },
  }, {
    schemaKeys: SPEC_SCHEMA_KEYS,
  });

  assert.deepEqual(issues, []);
});

test('collectSemanticRepairIssues falls back to legacy keys and reports missing semantic gaps in a stable order', () => {
  const issues = collectSemanticRepairIssues({});

  assert.deepEqual(issues, [
    'Fill the primary user in problem_frame.who.',
    'Fill the core job-to-be-done in problem_frame.what.',
    'Fill concrete success criteria in problem_frame.success.',
    'Add at least one concrete user role.',
    'Add at least one must-have feature.',
    'Add at least one input field with name and type.',
    'Add at least one permission rule.',
    'Add concrete test scenarios.',
    'Fill the standard developer request text.',
  ]);
});