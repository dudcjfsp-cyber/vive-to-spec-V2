import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./HybridStackGuidePanel.jsx', import.meta.url), 'utf8');

test('HybridStackGuidePanel uses recommendation-first wording', () => {
  assert.match(source, /title = '추천 구현 방식'/);
  assert.match(source, /아직 추천 구현 방식이 준비되지 않았습니다\./);
  assert.match(source, /추천 구현 방식을 가져오지 못했습니다\./);
  assert.doesNotMatch(source, /하이브리드 스택 가이드/);
});
