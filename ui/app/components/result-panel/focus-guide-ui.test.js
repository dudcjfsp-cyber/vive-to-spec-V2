import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildL1FocusGuideMessage,
  getUrgencyUiMeta,
  URGENCY_ORDER,
} from './focus-guide-ui.js';

test('getUrgencyUiMeta returns fallback meta for unknown urgency', () => {
  assert.equal(getUrgencyUiMeta('red').pattern, '!!!');
  assert.equal(getUrgencyUiMeta('unknown').label, '노랑');
  assert.deepEqual(URGENCY_ORDER, ['red', 'orange', 'yellow']);
});

test('buildL1FocusGuideMessage composes accessible urgency pattern text', () => {
  const text = buildL1FocusGuideMessage({
    warningTitle: '권한 충돌',
    urgency: 'red',
  });

  assert.ok(text.includes('권한 충돌'));
  assert.ok(text.includes('빨강'));
  assert.ok(text.includes('▲ !!!'));
  assert.ok(text.includes('즉시 수정 필요'));
});
