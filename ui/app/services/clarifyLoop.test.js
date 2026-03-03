import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWarningDrivenQuestions,
  buildClarifiedVibe,
  mergeClarificationQuestions,
  shouldOfferClarificationLoop,
} from './clarifyLoop.js';

test('shouldOfferClarificationLoop only enables guided loops when report requires clarification', () => {
  assert.equal(shouldOfferClarificationLoop({
    loopMode: 'off',
    maxClarifyTurns: 1,
    loopTurn: 0,
    validationReport: {
      needs_clarification: true,
      suggested_questions: ['질문 1'],
    },
  }), false);

  assert.equal(shouldOfferClarificationLoop({
    loopMode: 'guided_once',
    maxClarifyTurns: 1,
    loopTurn: 0,
    validationReport: {
      needs_clarification: true,
      suggested_questions: ['질문 1'],
    },
  }), true);

  assert.equal(shouldOfferClarificationLoop({
    loopMode: 'guided_once',
    maxClarifyTurns: 1,
    loopTurn: 1,
    validationReport: {
      needs_clarification: true,
      suggested_questions: ['질문 1'],
    },
  }), false);
});

test('buildClarifiedVibe appends only answered clarification lines', () => {
  const enriched = buildClarifiedVibe(
    '예약 관리 앱',
    ['관리자 권한이 필요한가요?', '알림 방식은 무엇인가요?'],
    {
      '관리자 권한이 필요한가요?': '관리자와 매장 직원 역할이 필요합니다.',
      '알림 방식은 무엇인가요?': '',
    },
  );

  assert.equal(
    enriched,
    '예약 관리 앱\n\n[추가 확정 정보]\n- 관리자 권한이 필요한가요?: 관리자와 매장 직원 역할이 필요합니다.',
  );
});

test('mergeClarificationQuestions deduplicates while keeping the original order', () => {
  const merged = mergeClarificationQuestions(
    ['Question A', 'Question B'],
    ['Question B', 'Question C', 'Question D'],
    3,
  );

  assert.deepEqual(merged, ['Question A', 'Question B', 'Question C']);
});

test('buildWarningDrivenQuestions prefers warning-specific prompts and suggested questions', () => {
  const questions = buildWarningDrivenQuestions({
    warningId: 'permission-delete',
    warningDetail: 'permission warning',
    validationReport: {
      suggested_questions: ['Question A', 'Question B'],
    },
  });

  assert.deepEqual(questions, [
    '삭제 가능한 역할은 누구이고, 삭제 전에 필요한 승인 단계는 무엇인가요?',
    'Question A',
    'Question B',
  ]);
});
