import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./ControlPanel.jsx', import.meta.url), 'utf8');

test('ControlPanel keeps provider and model changes in the global settings surface', () => {
  assert.match(source, /<h2>요구 입력<\/h2>/);
  assert.match(source, /프로바이더와 모델은 상단 헤더나 설정에서 바꿉니다\./);
  assert.doesNotMatch(source, /label htmlFor="provider"/);
  assert.doesNotMatch(source, /label htmlFor="model"/);
  assert.match(source, /API \/ 모델 설정 열기/);
});
