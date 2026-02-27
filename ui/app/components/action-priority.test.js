import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPriorityByIndex,
  normalizeActionText,
  parseBoldSegments,
} from './action-priority.js';

test('normalizeActionText removes numbered prefix', () => {
  assert.equal(normalizeActionText('1. **테마 에셋** 구체화'), '**테마 에셋** 구체화');
  assert.equal(normalizeActionText('  3. API 명세 정리  '), 'API 명세 정리');
});

test('parseBoldSegments returns bold tokens', () => {
  assert.deepEqual(parseBoldSegments('**핵심 작업** 먼저 진행'), [
    { text: '핵심 작업', bold: true },
    { text: ' 먼저 진행', bold: false },
  ]);
  assert.deepEqual(parseBoldSegments('강조 없음'), [
    { text: '강조 없음', bold: false },
  ]);
});

test('getPriorityByIndex maps order to high-medium-low', () => {
  assert.equal(getPriorityByIndex(1).id, 'high');
  assert.equal(getPriorityByIndex(2).id, 'medium');
  assert.equal(getPriorityByIndex(3).id, 'low');
  assert.equal(getPriorityByIndex(5).id, 'low');
});
