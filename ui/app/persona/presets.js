const DEFAULT_PERSONA_RUNTIME = Object.freeze({
  id: 'default',
  label: '',
  subtitle: '',
  selectionHint: '',
  tone: 'summary-first',
  workspaceKind: 'advanced',
  advancedWorkspaceVariant: 'experienced',
  promptPolicyMode: 'baseline',
  promptExperimentScope: 'default',
  capabilities: null,
});

const DEFAULT_PERSONA_CAPABILITIES = Object.freeze({
  showAdvancedPromptPolicyMeta: false,
  showLayerPanels: true,
  showCtaHistory: true,
  showIntegrityWarningsExpanded: true,
  loopMode: 'off',
  maxClarifyTurns: 0,
  showLoopControls: false,
  showValidationMeta: false,
  showCompactDeliveryPanel: false,
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
    selectionHint: '한 줄로 시작하고, 결과 뒤의 구조까지 함께 배우고 싶을 때',
    tone: 'action-first',
    workspaceKind: 'beginner',
    advancedWorkspaceVariant: 'beginner',
    promptPolicyMode: 'beginner_zero_shot',
    capabilities: {
      showAdvancedPromptPolicyMeta: false,
      showLayerPanels: true,
      showCtaHistory: true,
      showIntegrityWarningsExpanded: true,
      loopMode: 'off',
      maxClarifyTurns: 0,
      showLoopControls: false,
      showValidationMeta: false,
    },
  },
  {
    id: 'experienced',
    label: '빠른 실행형',
    subtitle: '핵심 경고만 보고 빠르게 정리',
    selectionHint: '오늘 바로 돌릴 결과와 상위 경고만 먼저 보고 싶을 때',
    tone: 'summary-first',
    workspaceKind: 'advanced',
    advancedWorkspaceVariant: 'experienced',
    promptPolicyMode: 'baseline',
    capabilities: {
      showAdvancedPromptPolicyMeta: false,
      showIntegrityWarningsExpanded: false,
      showLayerPanels: true,
      showCtaHistory: true,
      loopMode: 'guided_once',
      maxClarifyTurns: 1,
      showLoopControls: true,
      showValidationMeta: true,
    },
  },
  {
    id: 'major',
    label: '검토 통제형',
    subtitle: '계약과 영향 범위를 직접 점검',
    selectionHint: '구현 전에 계약, 영향, 리스크를 직접 확인하고 싶을 때',
    tone: 'full-control',
    workspaceKind: 'advanced',
    advancedWorkspaceVariant: 'major',
    promptPolicyMode: 'baseline',
    capabilities: {
      showAdvancedPromptPolicyMeta: false,
      showIntegrityWarningsExpanded: true,
      showLayerPanels: false,
      showCtaHistory: false,
      loopMode: 'manual',
      maxClarifyTurns: 3,
      showLoopControls: true,
      showValidationMeta: false,
      showCompactDeliveryPanel: true,
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
