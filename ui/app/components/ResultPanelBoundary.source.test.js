import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./ResultPanelBoundary.jsx', import.meta.url), 'utf8');

test('ResultPanelBoundary falls back to a safe status card when ResultPanel crashes', () => {
  assert.match(source, /static getDerivedStateFromError/);
  assert.match(source, /세부 결과를 여는 중 문제가 생겼습니다/);
  assert.match(source, /입력과 생성 결과는 그대로 유지됩니다\./);
  assert.match(source, /모드를 다시 열거나 다시 생성하면 다시 시도합니다\./);
});
