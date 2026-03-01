const DEFAULT_PERSONA_RUNTIME = Object.freeze({
  id: 'default',
  label: '',
  subtitle: '',
  tone: 'summary-first',
  workspaceKind: 'advanced',
  advancedWorkspaceVariant: 'experienced',
  promptPolicyMode: 'baseline',
  supportsStrictFormat: false,
  promptExperimentScope: 'default',
  capabilities: null,
});

const DEFAULT_PERSONA_CAPABILITIES = Object.freeze({
  showPromptPolicyMeta: false,
  showAdvancedPromptPolicyMeta: false,
  allowBeginnerAdvancedToggle: true,
  defaultBeginnerAdvancedOpen: false,
  showLayerPanels: true,
  showLegacyArtifacts: true,
  showCtaHistory: true,
  showIntegrityWarningsExpanded: true,
});

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizePersonaCapabilities(value) {
  const safeValue = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    ...DEFAULT_PERSONA_CAPABILITIES,
    ...safeValue,
  });
}

function withPersonaRuntimeDefaults(preset) {
  const safePreset = preset && typeof preset === 'object' ? preset : {};
  const rawCapabilities = safePreset.capabilities;
  const merged = {
    ...DEFAULT_PERSONA_RUNTIME,
    ...safePreset,
    capabilities: normalizePersonaCapabilities(rawCapabilities),
  };

  const normalizedId = toText(merged.id, DEFAULT_PERSONA_RUNTIME.id);
  return Object.freeze({
    ...merged,
    id: normalizedId,
    promptExperimentScope: toText(merged.promptExperimentScope, normalizedId || DEFAULT_PERSONA_RUNTIME.promptExperimentScope),
  });
}

export const PERSONA_PRESETS = [
  {
    id: 'beginner',
    label: '바이브코딩 입문자',
    subtitle: '최소 입력으로 결과 빨리 뽑기',
    tone: 'action-first',
    workspaceKind: 'beginner',
    advancedWorkspaceVariant: 'beginner',
    promptPolicyMode: 'beginner_zero_shot',
    supportsStrictFormat: false,
    capabilities: {
      showPromptPolicyMeta: true,
      showAdvancedPromptPolicyMeta: false,
      allowBeginnerAdvancedToggle: true,
      defaultBeginnerAdvancedOpen: false,
      showLayerPanels: true,
      showLegacyArtifacts: true,
      showCtaHistory: true,
      showIntegrityWarningsExpanded: true,
    },
  },
  {
    id: 'experienced',
    label: '바이브코딩 경험자',
    subtitle: '핵심 경고 중심으로 빠르게 정리',
    tone: 'summary-first',
    workspaceKind: 'advanced',
    advancedWorkspaceVariant: 'experienced',
    promptPolicyMode: 'baseline',
    supportsStrictFormat: true,
    capabilities: {
      showPromptPolicyMeta: false,
      showAdvancedPromptPolicyMeta: false,
      showIntegrityWarningsExpanded: false,
      showLayerPanels: true,
      showLegacyArtifacts: true,
      showCtaHistory: true,
    },
  },
  {
    id: 'major',
    label: '개발관련 전공자',
    subtitle: '레이어/진단/상태를 전체 노출',
    tone: 'full-control',
    workspaceKind: 'advanced',
    advancedWorkspaceVariant: 'major',
    promptPolicyMode: 'baseline',
    supportsStrictFormat: true,
    capabilities: {
      showPromptPolicyMeta: true,
      showAdvancedPromptPolicyMeta: true,
      showIntegrityWarningsExpanded: true,
      showLayerPanels: true,
      showLegacyArtifacts: true,
      showCtaHistory: true,
    },
  },
].map((preset) => withPersonaRuntimeDefaults(preset));

export function resolvePersonaPreset(personaId) {
  const key = toText(personaId);
  if (!key) return null;
  return PERSONA_PRESETS.find((preset) => preset.id === key) || null;
}

export function resolvePersonaRuntimeConfig(personaOrId) {
  const resolvedPreset = typeof personaOrId === 'string'
    ? resolvePersonaPreset(personaOrId)
    : withPersonaRuntimeDefaults(personaOrId);

  if (!resolvedPreset) {
    return withPersonaRuntimeDefaults(DEFAULT_PERSONA_RUNTIME);
  }

  return resolvedPreset;
}

export function resolvePersonaCapabilities(personaOrId) {
  return resolvePersonaRuntimeConfig(personaOrId).capabilities;
}
