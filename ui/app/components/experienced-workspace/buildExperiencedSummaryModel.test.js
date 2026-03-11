import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExperiencedSummaryModel } from './buildExperiencedSummaryModel.js';

test('buildExperiencedSummaryModel normalizes quick-mode summary input from derived output', () => {
  const result = buildExperiencedSummaryModel({
    state: {
      hybridStackGuide: {
        frames: [{ id: 'nextjs' }],
      },
      hybridStackGuideStatus: 'success',
    },
    derived: {
      masterPrompt: '짧은 요청 기본문',
      devSpec: '개발 스펙',
      nondevSpec: '비개발 스펙',
      standardOutput: {
        오늘_할_일_3개: ['폼 정리', 'API 연결', '테스트 추가', '배포'],
        수정요청_변환: {
          표준_요청: '주문 취소 흐름을 정리해줘',
        },
        완성도_진단: {
          점수_0_100: 82,
          누락_경고: ['권한 확인', '에러 상태 정의'],
        },
        입력_데이터_필드: [
          { 이름: 'orderId', 타입: 'string', 필수: true },
        ],
      },
      validationReport: {
        severity: 'medium',
      },
      clarifyLoop: {
        questions: ['취소 사유는 필수인가요?'],
        answers: {
          '취소 사유는 필수인가요?': '예',
        },
        loopTurn: 1,
        canSubmit: true,
      },
    },
  });

  assert.deepEqual(result.actions.today, ['폼 정리', 'API 연결', '테스트 추가']);
  assert.deepEqual(result.actions.topWarnings, ['권한 확인', '에러 상태 정의']);
  assert.equal(result.delivery.quickRequestBase, '주문 취소 흐름을 정리해줘');
  assert.equal(result.completion.score, 82);
  assert.equal(result.validation.severity, 'medium');
  assert.equal(result.validation.hasReport, true);
  assert.deepEqual(result.guide.data, { frames: [{ id: 'nextjs' }] });
  assert.equal(result.guide.status, 'success');
  assert.deepEqual(result.clarify.questions, ['취소 사유는 필수인가요?']);
  assert.equal(result.clarify.loopTurn, 1);
  assert.equal(result.clarify.canSubmit, true);
  assert.equal(result.promptContext.masterPrompt, '짧은 요청 기본문');
  assert.equal(typeof result.promptContext.hypothesis, 'object');
  assert.equal(typeof result.promptContext.logicMap, 'object');
});