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
      suggested_questions: ['Question 1'],
    },
  }), false);

  assert.equal(shouldOfferClarificationLoop({
    loopMode: 'guided_once',
    maxClarifyTurns: 1,
    loopTurn: 0,
    validationReport: {
      needs_clarification: true,
      suggested_questions: ['Question 1'],
    },
  }), true);

  assert.equal(shouldOfferClarificationLoop({
    loopMode: 'guided_once',
    maxClarifyTurns: 1,
    loopTurn: 1,
    validationReport: {
      needs_clarification: true,
      suggested_questions: ['Question 1'],
    },
  }), false);
});

test('buildClarifiedVibe appends only answered clarification lines', () => {
  const enriched = buildClarifiedVibe(
    'Summarize meeting notes',
    ['Who can delete records?', 'How should alerts be sent?'],
    {
      'Who can delete records?': 'Only admins can delete records.',
      'How should alerts be sent?': '',
    },
  );

  assert.equal(
    enriched,
    'Summarize meeting notes\n\n[추가 확정 정보]\n- Who can delete records?: Only admins can delete records.',
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

test('buildWarningDrivenQuestions keeps schema warnings anchored to the clicked warning', () => {
  const questions = buildWarningDrivenQuestions({
    warningId: 'schema-1',
    warningDetail: 'AI 모델의 구체적인 학습 데이터 및 평가 지표에 대한 계획이 부족합니다.',
    validationReport: {
      suggested_questions: ['삭제 가능한 역할은 누구인가요?'],
    },
  });

  assert.deepEqual(questions, [
    '이 경고를 해소하려면 다음 부족한 부분을 구체적으로 보완해 주세요: AI 모델의 구체적인 학습 데이터 및 평가 지표에 대한 계획이 부족합니다.',
  ]);
});
