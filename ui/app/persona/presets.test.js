import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSONA_PRESETS,
  resolvePersonaCapabilities,
  resolvePersonaPreset,
  resolvePersonaRuntimeConfig,
} from './presets.js';

test('persona presets expose runtime config in one place', () => {
  const beginner = resolvePersonaPreset('beginner');
  const experienced = resolvePersonaPreset('experienced');
  const major = resolvePersonaPreset('major');

  assert.equal(PERSONA_PRESETS.length, 3);
  assert.equal(beginner?.workspaceKind, 'beginner');
  assert.equal(beginner?.advancedWorkspaceVariant, 'beginner');
  assert.equal(beginner?.promptPolicyMode, 'beginner_zero_shot');
  assert.equal(beginner?.supportsStrictFormat, false);
  assert.equal(beginner?.capabilities.showPromptPolicyMeta, true);
  assert.equal(beginner?.capabilities.showAdvancedPromptPolicyMeta, false);
  assert.equal(beginner?.capabilities.allowBeginnerAdvancedToggle, true);
  assert.equal(experienced?.workspaceKind, 'advanced');
  assert.equal(experienced?.advancedWorkspaceVariant, 'experienced');
  assert.equal(experienced?.promptPolicyMode, 'baseline');
  assert.equal(experienced?.supportsStrictFormat, true);
  assert.equal(experienced?.capabilities.showLayerPanels, true);
  assert.equal(experienced?.capabilities.showAdvancedPromptPolicyMeta, false);
  assert.equal(experienced?.capabilities.showIntegrityWarningsExpanded, false);
  assert.equal(major?.workspaceKind, 'advanced');
  assert.equal(major?.advancedWorkspaceVariant, 'major');
  assert.equal(major?.promptPolicyMode, 'baseline');
  assert.equal(major?.capabilities.showPromptPolicyMeta, true);
  assert.equal(major?.capabilities.showAdvancedPromptPolicyMeta, true);
});

test('resolvePersonaRuntimeConfig falls back to a safe default', () => {
  const fallback = resolvePersonaRuntimeConfig(null);

  assert.equal(fallback.id, 'default');
  assert.equal(fallback.workspaceKind, 'advanced');
  assert.equal(fallback.advancedWorkspaceVariant, 'experienced');
  assert.equal(fallback.promptPolicyMode, 'baseline');
  assert.equal(fallback.supportsStrictFormat, false);
  assert.equal(fallback.capabilities.showLayerPanels, true);
  assert.equal(fallback.capabilities.showPromptPolicyMeta, false);
  assert.equal(fallback.capabilities.showAdvancedPromptPolicyMeta, false);
});

test('resolvePersonaCapabilities returns normalized capability flags', () => {
  const capabilities = resolvePersonaCapabilities('beginner');
  const fallbackCapabilities = resolvePersonaCapabilities('unknown');

  assert.equal(capabilities.showPromptPolicyMeta, true);
  assert.equal(capabilities.allowBeginnerAdvancedToggle, true);
  assert.equal(capabilities.defaultBeginnerAdvancedOpen, false);
  assert.equal(capabilities.showLegacyArtifacts, true);
  assert.equal(fallbackCapabilities.showPromptPolicyMeta, false);
  assert.equal(fallbackCapabilities.showAdvancedPromptPolicyMeta, false);
  assert.equal(fallbackCapabilities.showLayerPanels, true);
});
