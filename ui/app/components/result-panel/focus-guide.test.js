import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildL1FocusGuideFromWarning,
  getUrgencyFromWarning,
  inferL1TargetFields,
} from './focus-guide.js';

test('inferL1TargetFields prioritizes explicit warning-id mapping', () => {
  assert.deepEqual(inferL1TargetFields({
    warning: { id: 'intent-mismatch', detail: '텍스트가 맞지 않습니다.' },
  }), ['what', 'why']);
});

test('inferL1TargetFields uses low-confidence fields for intent confidence warning', () => {
  assert.deepEqual(inferL1TargetFields({
    warning: { id: 'intent-low-confidence' },
    l1LowConfidenceFields: ['success', 'who'],
  }), ['who', 'success']);
});

test('inferL1TargetFields uses domain fallback with keyword boost to reduce misses', () => {
  assert.deepEqual(inferL1TargetFields({
    warning: {
      id: 'schema-3',
      domain: 'permission',
      detail: '삭제 권한이 운영자 역할에서 열려 있습니다.',
    },
  }), ['who', 'what']);
});

test('inferL1TargetFields avoids when-field false positives for response-time metrics', () => {
  assert.deepEqual(inferL1TargetFields({
    warning: {
      id: 'schema-7',
      domain: 'completeness',
      detail: '응답 시간 지표 측정이 누락되었습니다.',
    },
  }), ['success']);
});

test('buildL1FocusGuideFromWarning returns domain-only guide payload', () => {
  const warning = {
    id: 'schema-0',
    title: '권한 충돌',
    detail: '삭제 권한 검토가 필요합니다.',
    severity: 'critical',
    score: 98,
    domain: 'permission',
  };
  assert.equal(getUrgencyFromWarning(warning), 'red');

  const guide = buildL1FocusGuideFromWarning({ warning });
  assert.equal(guide.urgency, 'red');
  assert.equal(guide.warningTitle, '권한 충돌');
  assert.deepEqual(guide.targetFields, ['who', 'what']);
});
