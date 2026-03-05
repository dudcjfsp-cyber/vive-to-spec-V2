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

test('buildL1Intelligence keeps current values while exposing inferred alternatives', () => {
  const hypothesis = {
    who: '사내 안전 관리 담당자 및 연구원',
    when: '새로운 화학 물질 MSDS 문서를 검토하거나 기존 문서에서 특정 위험 정보를 빠르게 찾아야 할 때',
    what: '방대한 MSDS PDF 문서에서 핵심 내용(요약)과 특히 중요한 위험 문구를 수동으로 찾아내야 하는 비효율성',
    why: '수동 검토 시간을 줄이고 안전 사고로 이어질 수 있는 누락을 막기 위해',
    success: '정보 파악 시간을 50% 이상 단축하고 위험 문구 식별 정확도를 높인다',
  };
  const vibeText = 'MSDS PDF 내용을 추출해서 요약하고, 위험 문구만 따로 체크하는 사내 도구를 만들고 싶어. 업로드 파일, 권한, 테스트 기준까지 개발 요청서 형태로 정리해줘.';

  const result = buildL1Intelligence({ vibeText, hypothesis });

  assert.equal(result.suggestedHypothesis.what, hypothesis.what);
  assert.equal(result.inferredHypothesis.what, 'MSDS PDF 내용을 추출해서 요약하고, 위험 문구만 따로 체크하는 사내 도구');
  assert.notEqual(result.inferredHypothesis.what, result.suggestedHypothesis.what);
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
