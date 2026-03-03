import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClarifyStartedShadowPayload,
  buildGeneratedResultPlan,
  buildPromptExperimentId,
  buildTransmuteSuccessShadowPayload,
} from './transmuteFlow.js';

test('buildPromptExperimentId uses persona scope and policy mode', () => {
  assert.equal(buildPromptExperimentId({
    id: 'experienced',
    promptExperimentScope: 'experienced',
    promptPolicyMode: 'baseline',
  }), 'experienced_baseline_v1');
});

test('buildGeneratedResultPlan limits questions when loop is disabled', () => {
  const plan = buildGeneratedResultPlan({
    generated: {
      validation_report: {
        needs_clarification: true,
        suggested_questions: ['질문 1'],
      },
    },
    loopMode: 'off',
    maxClarifyTurns: 1,
    nextLoopTurn: 0,
    promptExperimentId: 'exp_baseline_v1',
  });

  assert.deepEqual(plan.nextQuestions, []);
  assert.equal(plan.validationReport?.needs_clarification, true);
  assert.match(plan.nextGenerationId, /^exp_baseline_v1_/);
});

test('buildTransmuteSuccessShadowPayload switches event type for regenerate flow', () => {
  const payload = buildTransmuteSuccessShadowPayload({
    generated: {
      model: 'gpt-4.1',
      meta: {
        prompt_policy_mode: 'baseline',
        prompt_experiment_id: 'exp_baseline_v1',
      },
    },
    apiProvider: 'openai',
    selectedModel: 'gpt-4.1',
    promptPolicyMode: 'baseline',
    promptExperimentId: 'exp_baseline_v1',
    validationReport: { severity: 'medium', can_auto_proceed: false },
    nextQuestions: ['질문 1'],
    nextLoopTurn: 1,
    nextGenerationId: 'exp_baseline_v1_123',
    clarificationAnswersPatch: { '질문 1': '답변' },
  });

  assert.equal(payload.type, 'regenerate_success');
  assert.equal(payload.currentNodeId, 'regenerate_success');
  assert.equal(payload.payload.validation_severity, 'medium');
  assert.equal(payload.payload.question_count, 1);
});

test('buildClarifyStartedShadowPayload returns null when there are no questions', () => {
  assert.equal(buildClarifyStartedShadowPayload({ nextQuestions: [] }), null);
});
