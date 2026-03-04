import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBeginnerQuickPrompt,
  computePromptSimilarity,
  isNearParaphrase,
} from './beginner-prompt.js';

test('computePromptSimilarity returns high score for near paraphrase', () => {
  const source = 'Upload an MSDS PDF and extract the safety data into a structured response.';
  const candidate = 'Build a service that uploads an MSDS PDF and extracts the safety data for the user.';
  const score = computePromptSimilarity(source, candidate);
  assert.ok(score >= 0.42);
  assert.equal(isNearParaphrase(source, candidate), true);
});

test('buildBeginnerQuickPrompt keeps the source prompt unchanged and emits warning-only checklist gaps', () => {
  const candidatePrompt = 'Build a service that uploads an MSDS PDF and extracts the safety data for the user.';
  const result = buildBeginnerQuickPrompt({
    vibe: 'Upload an MSDS PDF and extract the safety data into a structured response.',
    candidatePrompt,
  });

  assert.equal(result.prompt, candidatePrompt);
  assert.equal(result.meta.isEnhanced, true);
  assert.equal(result.meta.promptMutated, false);
  assert.equal(result.meta.deliveryMode, 'warning_only');
  assert.ok(result.meta.addedItemCount >= 3);
  assert.ok(result.meta.addedRequirements.some((item) => item.includes('입력 계약')));
  assert.ok(result.meta.addedRequirements.some((item) => item.includes('MSDS 추출 범위')));
});

test('buildBeginnerQuickPrompt suppresses warning-only hints when the prompt already covers the core checklist', () => {
  const detailed = [
    'Build an MSDS extraction service.',
    'Define the input contract up front: required fields, supported inputs, file types, size limits, page limits, and validation rules.',
    'Separate role and permission boundaries with a permission matrix and CRUD scope.',
    'Describe failure handling, fallback retries, and user-visible recovery steps.',
    'Lock the output contract with JSON response shape, field order, source references, and page numbers.',
    'State acceptance criteria, success criteria, verification checks, and test scenarios.',
    'Cover CAS, GHS, H code, P code, first aid, PPE, spill, fire, storage, and disposal details.',
  ].join(' ');

  const result = buildBeginnerQuickPrompt({
    vibe: 'Upload an MSDS PDF and extract the safety data into a structured response.',
    candidatePrompt: detailed,
  });

  assert.equal(result.meta.isEnhanced, false);
  assert.equal(result.meta.deliveryMode, 'none');
  assert.equal(result.meta.addedItemCount, 0);
  assert.equal(result.prompt, detailed);
});
