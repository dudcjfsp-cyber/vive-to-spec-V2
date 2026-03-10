import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./MajorWorkspace.jsx', import.meta.url), 'utf8');

test('MajorWorkspace keeps the input and result layout available before success', () => {
  assert.match(source, /<div className="layout-grid major-layout-grid">/);
  assert.match(source, /<ControlPanel/);
  assert.match(source, /<AdvancedResultPane/);
  assert.match(source, /검토 결과는 생성 후 표시됩니다/);
  assert.match(source, /resultViewModel=\{buildAdvancedResultViewModel\(/);
});

test('MajorWorkspace mode framing uses the plain-language review sequence', () => {
  assert.match(source, /순서: 검토 -&gt; 결정 -&gt; 결과 확정/);
  assert.doesNotMatch(source, /한 단계 올라가/);
});

test('MajorWorkspace review dashboard defaults to first-look summaries before details', () => {
  assert.match(source, /먼저 볼 것/);
  assert.match(source, /<details className="major-readiness-details">/);
  assert.match(source, /예외 기준과 추가 이슈/);
});
