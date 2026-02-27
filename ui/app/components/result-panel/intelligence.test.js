import test from 'node:test';
import assert from 'node:assert/strict';
import { buildL1Intelligence, buildL2Intelligence } from './intelligence.js';

test('buildL1Intelligence returns high confidence when hypothesis is explicit', () => {
  const hypothesis = {
    who: '비전공자 운영자',
    when: '로그인 직후',
    what: '결제 오류 자동 알림',
    why: '오류를 줄이기 위해',
    success: '오류율 KPI 감소',
  };
  const vibeText = [
    '비전공자 운영자는 로그인 직후 결제 오류 자동 알림을 확인합니다.',
    '오류를 줄이기 위해 대응하며 성공기준은 오류율 KPI 감소입니다.',
  ].join(' ');

  const result = buildL1Intelligence({ vibeText, hypothesis });

  assert.equal(result.confidenceBand, 'high');
  assert.ok(result.overallConfidence >= 80);
  assert.deepEqual(result.lowConfidenceFields, []);
  assert.equal(result.questions.length, 0);
  assert.equal(result.suggestedHypothesis.what, hypothesis.what);
});

test('buildL1Intelligence suggests hypotheses and asks clarifying questions on low confidence', () => {
  const result = buildL1Intelligence({
    vibeText: '비전공자 고객이 결제 시 오류를 줄이기 위해 주문 상태를 확인한다. 성공 지표는 완료율 KPI 상승이다.',
    hypothesis: {
      who: '',
      when: '',
      what: '',
      why: '',
      success: '',
    },
  });

  assert.equal(result.confidenceBand, 'low');
  assert.equal(result.overallConfidence, 0);
  assert.equal(result.lowConfidenceFields.length, 5);
  assert.equal(result.questions.length, 3);
  assert.match(result.suggestedHypothesis.who, /비전공자/);
  assert.match(result.suggestedHypothesis.when, /결제.*시/);
  assert.ok(result.suggestedHypothesis.what.length > 0);
});

test('buildL2Intelligence adds changed-axis suggestion and keeps strong coverage', () => {
  const result = buildL2Intelligence({
    changedAxis: 'db',
    logicMap: {
      text: '- order status reason\n- order status update\n- order reason sync',
      db: '- order status reason\n- order status update\n- order reason sync',
      api: '- order status reason\n- order status update\n- order reason sync',
      ui: '- order status reason\n- order status update\n- order reason sync',
    },
  });

  assert.ok(Object.values(result.coverageByAxis).every((score) => score >= 50));
  assert.ok(result.alignmentScore >= 45);
  assert.deepEqual(result.syncSuggestions, [
    'DB 변경을 API 요청/응답 필드와 UI 입력 검증 규칙에 연동하세요.',
  ]);
});

test('buildL2Intelligence limits weak-signal suggestions to top three', () => {
  const result = buildL2Intelligence({
    changedAxis: '',
    logicMap: {
      text: '주문 처리',
      db: '',
      api: '',
      ui: '',
    },
  });

  assert.equal(result.alignmentScore, 0);
  assert.equal(result.syncSuggestions.length, 3);
  assert.match(result.syncSuggestions[0], /^TEXT 축 정보가 부족합니다/);
  assert.match(result.syncSuggestions[1], /^DB 축 정보가 부족합니다/);
  assert.match(result.syncSuggestions[2], /^API 축 정보가 부족합니다/);
});
