import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMajorReviewModel } from './buildMajorReviewModel.js';

test('buildMajorReviewModel normalizes review-dashboard input from state and derived', () => {
  const result = buildMajorReviewModel({
    state: {
      activeModel: 'gpt-test',
    },
    derived: {
      standardOutput: {
        완성도_진단: {
          누락_경고: ['권한 검토 필요', '테스트 범위 점검'],
        },
        입력_데이터_필드: [
          { 이름: 'userId', 타입: 'string', 필수: true },
          { 이름: 'reason', 타입: 'string', 필수: false },
        ],
        변경_영향도: {
          화면: ['주문 상세'],
          권한: ['매니저 권한'],
          테스트: ['취소 흐름 테스트'],
        },
      },
      validationReport: {
        severity: 'high',
        blocking_issues: [
          { id: 'permission-conflict', message: '권한 충돌 확인 필요' },
        ],
      },
    },
  });

  assert.equal(result.validationSeverity, 'high');
  assert.equal(result.reliability.warningCount, 2);
  assert.equal(result.reliability.blockingCount, 1);
  assert.match(result.reliability.summaryItems[0], /차단:/);
  assert.equal(result.contract.fieldCount, 2);
  assert.equal(result.contract.requiredFieldCount, 1);
  assert.equal(result.contract.modelLabel, 'gpt-test');
  assert.match(result.contract.summaryItems[0], /userId/);
  assert.equal(result.impact.screenCount, 1);
  assert.equal(result.impact.permissionCount, 1);
  assert.equal(result.impact.testCount, 1);
  assert.match(result.impact.summaryItems[0], /화면:/);
});
