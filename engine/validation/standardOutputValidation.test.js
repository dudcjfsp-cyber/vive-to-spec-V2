import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClarificationCandidates,
  validateStandardOutput,
} from './standardOutputValidation.js';

function buildCompleteSpec() {
  return {
    한_줄_요약: '예약 관리 앱',
    문제정의_5칸: {
      누가: '소상공인 매장 운영자',
      언제: '영업 중',
      무엇을: '예약을 접수하고 상태를 변경한다',
      왜: '전화 응대를 줄이기 위해',
      성공기준: '예약 누락 없이 일별 예약 현황을 본다',
    },
    사용자_역할: [{ 역할: '운영자', 설명: '예약을 관리한다' }],
    핵심_기능: {
      필수: ['예약 생성', '예약 상태 변경'],
      있으면_좋음: ['문자 알림'],
    },
    화면_흐름_5단계: ['진입', '입력', '검토', '저장', '확인'],
    입력_데이터_필드: [{ 이름: '이름', 타입: 'string', 예시: '홍길동' }],
    권한_규칙: [{ 역할: '운영자', 조회: true, 생성: true, 수정: true, 삭제: false, 비고: '' }],
    테스트_시나리오_3개: ['정상 등록', '입력 누락', '권한 없음'],
    수정요청_변환: {
      표준_요청: '예약 생성 기능을 우선 구현해주세요.',
    },
  };
}

test('validateStandardOutput returns low severity when core fields are present', () => {
  const report = validateStandardOutput(buildCompleteSpec());

  assert.equal(report.can_auto_proceed, true);
  assert.equal(report.severity, 'low');
  assert.equal(report.blocking_issue_count, 0);
  assert.equal(report.warning_count, 0);
  assert.equal(report.score, 100);
  assert.deepEqual(report.suggested_questions, []);
  assert.equal(report.needs_clarification, false);
});

test('validateStandardOutput returns blocking issues and clarification prompts when core fields are missing', () => {
  const report = validateStandardOutput({
    한_줄_요약: '',
    문제정의_5칸: {
      누가: '',
      무엇을: '',
      성공기준: '',
    },
    사용자_역할: [],
    핵심_기능: {
      필수: [],
    },
    화면_흐름_5단계: [],
    입력_데이터_필드: [],
    권한_규칙: [],
    테스트_시나리오_3개: [],
    수정요청_변환: {
      표준_요청: '',
    },
  });

  assert.equal(report.can_auto_proceed, false);
  assert.equal(report.severity, 'high');
  assert.ok(report.blocking_issue_count >= 5);
  assert.ok(report.warning_count >= report.blocking_issue_count);
  assert.equal(report.suggested_questions.length, 3);
  assert.equal(report.needs_clarification, true);
});

test('buildClarificationCandidates uses blocking issues first and limits the list to three', () => {
  const questions = buildClarificationCandidates({
    blocking_issues: [
      { id: 'missing_problem_who' },
      { id: 'missing_problem_what' },
      { id: 'missing_problem_success' },
      { id: 'missing_permissions' },
    ],
    warnings: [],
  });

  assert.deepEqual(questions, [
    '누가 이 기능을 가장 자주 사용하는지 알려주세요.',
    '사용자가 이 기능으로 정확히 무엇을 해야 하는지 알려주세요.',
    '완료를 어떻게 판단할지 성공 기준을 알려주세요.',
  ]);
});
