import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBeginnerInputNudge } from './beginner-input-nudge.js';

test('buildBeginnerInputNudge suggests audience and timing first', () => {
  const nudge = buildBeginnerInputNudge('회의록을 요약하는 웹앱');

  assert.equal(nudge?.label, '누가/언제 쓰는지 한 줄 추가');
  assert.match(nudge?.suggestedLine || '', /누가\/언제:/);
});

test('buildBeginnerInputNudge suggests success criteria when audience exists', () => {
  const nudge = buildBeginnerInputNudge('운영자가 문의가 몰릴 때 사용하는 자동 응답 도구');

  assert.equal(nudge?.label, '성공 기준 한 줄 추가');
  assert.match(nudge?.suggestedLine || '', /성공 기준:/);
});

test('buildBeginnerInputNudge suggests constraints after audience and success exist', () => {
  const nudge = buildBeginnerInputNudge('운영자가 고객 문의가 몰릴 때 쓰는 도구이고 성공 기준은 응답 시간을 줄이는 것이다');

  assert.equal(nudge?.label, '핵심 조건 한 줄 추가');
  assert.match(nudge?.suggestedLine || '', /핵심 조건:/);
});
