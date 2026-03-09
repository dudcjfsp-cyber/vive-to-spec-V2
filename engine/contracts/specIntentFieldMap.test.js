import test from 'node:test';
import assert from 'node:assert/strict';
import { SPEC_INTENT_FIELD_MAP } from './specIntentFieldMap.js';

test('SPEC_INTENT_FIELD_MAP keeps the spec renderer field aliases explicit', () => {
  assert.equal(SPEC_INTENT_FIELD_MAP.summary, '한 줄 요약');
  assert.equal(SPEC_INTENT_FIELD_MAP.problemFrame, '문제정의_5가지');
  assert.equal(SPEC_INTENT_FIELD_MAP.must, '필수');
  assert.equal(SPEC_INTENT_FIELD_MAP.permissions, '권한_규칙');
});
