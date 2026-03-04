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
  assert.equal(policy.coreChecklistDelivery, 'force_injected');
  assert.deepEqual(policy.coreChecklistIds, [
    'input_contract',
    'role_permissions',
    'failure_handling',
    'output_contract',
    'acceptance_checks',
  ]);
  assert.ok(policy.positiveRewriteCount >= 1);
});

test('strict format policy is the only standard mode that enables minimal examples', () => {
  const strictFormat = resolvePromptPolicy({ mode: 'strict_format' });
  const baseline = resolvePromptPolicy({ mode: 'baseline' });

  assert.equal(strictFormat.allowExamples, true);
  assert.equal(strictFormat.exampleMode, 'minimal');
  assert.equal(baseline.allowExamples, false);
  assert.equal(baseline.coreChecklistDelivery, 'baseline_only');
});

test('semantic repair policy resolves as a repair-specific example mode', () => {
  const policy = resolvePromptPolicy({ taskType: 'semantic_repair' });

  assert.equal(policy.mode, 'semantic_repair');
  assert.equal(policy.allowExamples, true);
  assert.equal(policy.exampleMode, 'repair');
  assert.equal(policy.positiveFirst, true);
  assert.ok(policy.coreChecklistLines.length > 0);
});

test('rewriteInstructionsPositiveFirst converts negative phrasing to positive-first guidance', () => {
  const rewritten = rewriteInstructionsPositiveFirst('Do not write long explanations.');

  assert.equal(rewritten, 'Keep explanations concise and limited to 1-2 sentences.');
});

test('buildPromptSections keeps policy section ordering stable', () => {
  const policy = resolvePromptPolicy({ persona: 'beginner' });
  const sections = buildPromptSections({
    vibe: 'Build a small admin tool',
    schemaHint: '{"ok":true}',
    baseSystemPrompt: 'Base policy',
    policy,
    showThinking: false,
  });

  assert.deepEqual(
    sections.map((section) => section.id),
    ['role', 'constraints', 'schema', 'goal', 'core_checklist', 'runtime', 'user_vibe'],
  );
  assert.match(sections[4].content, /Define the input contract up front/);
});

test('buildPromptPolicyMeta records checklist delivery metadata with backward-compatible defaults', () => {
  const policy = resolvePromptPolicy({ persona: 'beginner' });
  const meta = buildPromptPolicyMeta({
    vibe: 'Build a small admin tool',
    persona: 'beginner',
    policy,
    promptSections: ['role', 'constraints', 'core_checklist'],
    positiveRewriteCount: policy.positiveRewriteCount,
    promptExperimentId: 'beginner_zero_shot_v1',
  });

  assert.deepEqual(meta.prompt_sections, ['role', 'constraints', 'core_checklist']);
  assert.equal(meta.prompt_policy_mode, 'beginner_zero_shot');
  assert.equal(meta.policy_applied, true);
  assert.equal(meta.prompt_experiment_id, 'beginner_zero_shot_v1');
  assert.equal(meta.core_checklist_delivery, 'force_injected');
  assert.deepEqual(meta.core_checklist_ids, [
    'input_contract',
    'role_permissions',
    'failure_handling',
    'output_contract',
    'acceptance_checks',
  ]);
});
