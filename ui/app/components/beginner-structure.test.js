import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBeginnerStructureSummary } from './beginner-structure.js';

test('buildBeginnerStructureSummary returns the four prompt structure slots', () => {
  const summary = buildBeginnerStructureSummary({
    문제정의_5칸: {
      누가: '매장 운영자',
      언제: '고객 문의가 몰릴 때',
      무엇을: '매장 문의를 자동 응답하는 서비스',
      성공기준: '운영자가 답변 시간을 줄일 수 있다',
    },
    예외_모호한_점: {
      부족한_정보: ['어떤 문의 유형까지 자동 응답할지 정해야 합니다.'],
    },
  });

  assert.equal(summary.slots.length, 4);
  assert.deepEqual(summary.slots.map((slot) => slot.label), [
    '무엇을 만들지',
    '누가/언제 쓰는지',
    '핵심 조건 또는 주의점',
    '성공 기준',
  ]);
  assert.equal(summary.slots[0].value, '매장 문의를 자동 응답하는 서비스');
  assert.equal(summary.slots[1].value, '매장 운영자 / 고객 문의가 몰릴 때');
  assert.equal(summary.slots[2].value, '어떤 문의 유형까지 자동 응답할지 정해야 합니다.');
  assert.equal(summary.slots[3].value, '운영자가 답변 시간을 줄일 수 있다');
  assert.equal(summary.missingCount, 0);
  assert.match(summary.strengthHighlight, /무엇을 만들지와 누가 언제 쓰는지/);
  assert.match(summary.oneStepGuide, /한 칸만 더 선명하게/);
  assert.match(summary.coachingHints[0], /이번 초안에서 특히 먼저 챙길 조건/);
  assert.equal(summary.primaryNudge, null);
});

test('buildBeginnerStructureSummary exposes missing thinking slots as coaching prompts', () => {
  const summary = buildBeginnerStructureSummary({
    문제정의_5칸: {
      무엇을: '회의록 요약 웹앱',
    },
  });

  assert.equal(summary.slots[0].isMissing, false);
  assert.equal(summary.slots[1].isMissing, true);
  assert.equal(summary.slots[3].isMissing, true);
  assert.match(summary.slots[1].value, /누가 쓰는지와 언제 쓰는지/);
  assert.match(summary.slots[3].value, /성공하면 무엇이 달라지는지/);
  assert.equal(summary.missingCount, 2);
  assert.match(summary.note, /비어 있는 칸 2개/);
  assert.match(summary.strengthHighlight, /무엇을 만들지 한 문장/);
  assert.match(summary.oneStepGuide, /비어 있는 칸 하나만 채워도 충분/);
  assert.match(summary.coachingHints[0], /누가 언제 쓰는지/);
  assert.match(summary.coachingHints[1], /성공 기준/);
  assert.equal(summary.primaryNudge?.label, '누가/언제 쓰는지 한 줄 추가');
  assert.match(summary.primaryNudge?.suggestedLine || '', /누가\/언제:/);
});
