import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPromptPolicyMeta,
  buildPromptSections,
  resolvePromptPolicy,
  rewriteInstructionsPositiveFirst,
} from './promptPolicy.js';

test('beginner policy defaults to zero-shot without examples', () => {
  const policy = resolvePromptPolicy({ persona: 'beginner' });

  assert.equal(policy.mode, 'beginner_zero_shot');
  assert.equal(policy.allowExamples, false);
  assert.equal(policy.exampleMode, 'none');
  assert.ok(policy.positiveRewriteCount >= 1);
});

test('strict format policy is the only mode that enables examples', () => {
  const strictFormat = resolvePromptPolicy({ mode: 'strict_format' });
  const baseline = resolvePromptPolicy({ mode: 'baseline' });

  assert.equal(strictFormat.allowExamples, true);
  assert.equal(strictFormat.exampleMode, 'minimal');
  assert.equal(baseline.allowExamples, false);
});

test('rewriteInstructionsPositiveFirst converts negative phrasing to positive-first guidance', () => {
  const rewritten = rewriteInstructionsPositiveFirst('설명문을 길게 쓰지 마라');

  assert.equal(rewritten, '설명문은 핵심만 1~2문장으로 간결하게 작성하라');
});

test('buildPromptSections keeps policy section ordering stable', () => {
  const policy = resolvePromptPolicy({ persona: 'beginner' });
  const sections = buildPromptSections({
    vibe: '간단한 내부 관리 도구',
    schemaHint: '{"ok":true}',
    baseSystemPrompt: 'Base policy',
    policy,
    showThinking: false,
  });

  assert.deepEqual(
    sections.map((section) => section.id),
    ['role', 'constraints', 'schema', 'goal', 'runtime', 'user_vibe'],
  );
});

test('buildPromptPolicyMeta records policy metadata with backward-compatible defaults', () => {
  const policy = resolvePromptPolicy({ persona: 'beginner' });
  const meta = buildPromptPolicyMeta({
    vibe: '관리자 페이지',
    persona: 'beginner',
    policy,
    promptSections: ['role', 'constraints', 'schema'],
    positiveRewriteCount: policy.positiveRewriteCount,
    promptExperimentId: 'beginner_zero_shot_v1',
  });

  assert.deepEqual(meta.prompt_sections, ['role', 'constraints', 'schema']);
  assert.equal(meta.prompt_policy_mode, 'beginner_zero_shot');
  assert.equal(meta.policy_applied, true);
  assert.equal(meta.prompt_experiment_id, 'beginner_zero_shot_v1');
});
