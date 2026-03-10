import React, { useEffect, useMemo, useState } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import BeginnerWorkspace from './components/BeginnerWorkspace';
import ExperiencedWorkspace from './components/ExperiencedWorkspace';
import MajorWorkspace from './components/MajorWorkspace';
import PersonaSelector from './components/PersonaSelector';
import { useAppController } from './hooks/useAppController';
import { PERSONA_PRESETS, resolvePersonaPreset, resolvePersonaRuntimeConfig } from './persona/presets';

const PERSONA_STORAGE_KEY = 'vibe_to_spec_persona';

function getHeaderCopy({ activePersona, isBeginnerWorkspace, requiresApiKey }) {
  if (activePersona) {
    if (isBeginnerWorkspace) {
      return '한 문장 입력으로 실행 가능한 초안을 빠르게 만들고, 필요한 힌트만 짧게 확인합니다.';
    }
    if (activePersona.id === 'major') {
      return '구현 전에 계약, 영향 범위, 차단 이슈를 먼저 검토한 뒤 결과를 확정하는 교육형 워크스페이스.';
    }
    return '오늘 바로 실행할 결과를 먼저 만들고, 핵심 경고와 한 번의 보완만 확인하는 교육형 워크스페이스.';
  }

  if (requiresApiKey) {
    return '세션을 먼저 고르고, 바로 같은 화면에서 연결과 작업 시작까지 이어집니다.';
  }

  return '세션을 먼저 고르고 바로 작업을 시작합니다.';
}

function renderApiKeyGate({
  state,
  derived,
  actions,
  activePersona,
}) {
  const selectedLabel = activePersona?.label || '원하는 세션';
  return (
    <section className="panel api-key-gate">
      <div className="panel-head">
        <h2>API 키 연결</h2>
        <p>{selectedLabel} 화면으로 바로 이어서 진입할 수 있도록 먼저 API 키를 연결합니다.</p>
      </div>
      <div className="control-grid">
        <div className="form-group">
          <label htmlFor="gate-provider">프로바이더</label>
          <select
            id="gate-provider"
            value={state.apiProvider}
            onChange={(event) => actions.setApiProvider(event.target.value)}
          >
            {derived.providerOptions.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="stack-actions">
        <button type="button" className="btn btn-primary" onClick={() => actions.setIsSettingsOpen(true)}>
          API 키 입력하기
        </button>
      </div>
      <p className="small-muted">
        API 키를 저장하면 현재 선택한 세션으로 바로 이어집니다.
      </p>
    </section>
  );
}

export default function App() {
  const [personaId, setPersonaId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(PERSONA_STORAGE_KEY) || '';
  });
  const activePersona = useMemo(
    () => resolvePersonaPreset(personaId),
    [personaId],
  );
  const activePersonaConfig = useMemo(
    () => resolvePersonaRuntimeConfig(activePersona),
    [activePersona],
  );
  const { state, derived, actions } = useAppController({
    personaConfig: activePersonaConfig,
  });
  const hasApiAccess = state.hasApiAccess;
  const requiresApiKey = state.requiresApiKey;
  const providerLabel = derived.providerOptions.find((item) => item.id === state.apiProvider)?.label || state.apiProvider;
  const apiStatusLabel = requiresApiKey
    ? (hasApiAccess ? providerLabel : '연결 필요')
    : `관리형 서버 (${providerLabel})`;
  const isBeginnerWorkspace = activePersonaConfig.workspaceKind === 'beginner';
  const advancedWorkspaceVariant = activePersonaConfig.advancedWorkspaceVariant;
  const activePersonaCapabilities = activePersonaConfig.capabilities;
  const headerCopy = getHeaderCopy({ activePersona, isBeginnerWorkspace, requiresApiKey });
  const modelStatusLabel = state.selectedModel || (state.isModelOptionsLoading ? '불러오는 중' : (state.activeModel || '선택 안 됨'));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activePersona) {
      window.sessionStorage.setItem(PERSONA_STORAGE_KEY, activePersona.id);
    } else {
      window.sessionStorage.removeItem(PERSONA_STORAGE_KEY);
    }
  }, [activePersona]);

  const handleSelectPersona = (nextPersonaId) => {
    if (state.status === 'processing') return;
    setPersonaId(nextPersonaId);
  };

  const handleResetPersona = () => {
    if (state.status === 'processing') return;
    setPersonaId('');
  };

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div>
          <p className="eyebrow">학습 스펙 워크스페이스</p>
          <h1>Vibe-to-Spec V2</h1>
          <p className="header-copy">{headerCopy}</p>
        </div>
        <div className="header-meta">
          <span className="status-chip">
            세션: {activePersona?.label || '선택 전'}
          </span>
          <button
            type="button"
            className={`status-chip status-chip-button ${hasApiAccess ? '' : 'muted'}`}
            onClick={() => actions.setIsSettingsOpen(true)}
            disabled={state.status === 'processing'}
            title="Open API settings"
          >
            API: {apiStatusLabel}
          </button>
          <button
            type="button"
            className="status-chip status-chip-button muted"
            onClick={() => actions.setIsSettingsOpen(true)}
            disabled={state.status === 'processing'}
            title="Open API settings"
          >
            모델: {modelStatusLabel}
          </button>

          {activePersona && (
            <button
              type="button"
              className="btn btn-ghost btn-mini"
              onClick={handleResetPersona}
              disabled={state.status === 'processing'}
            >
              세션 해제
            </button>
          )}
        </div>
      </header>

      <PersonaSelector
        presets={PERSONA_PRESETS}
        selectedPersonaId={activePersona?.id || ''}
        compact={Boolean(activePersona)}
        disabled={state.status === 'processing'}
        onSelectPersona={handleSelectPersona}
      />

      {requiresApiKey && !hasApiAccess && renderApiKeyGate({
        state,
        derived,
        actions,
        activePersona,
      })}

      {hasApiAccess && !activePersona && (
        <section className="panel persona-pending">
          <div className="panel-head">
            <h2>세션을 선택해 계속</h2>
            <p>입문자는 구조 학습, 빠른 실행형은 즉시 실행, 검토 통제형은 계약과 영향 검토에 더 맞습니다.</p>
          </div>
        </section>
      )}

      {hasApiAccess && activePersona && isBeginnerWorkspace && (
        <BeginnerWorkspace
          vibe={state.vibe}
          status={state.status}
          errorMessage={state.errorMessage}
          standardOutput={derived.standardOutput}
          masterPrompt={derived.masterPrompt}
          showApiSettings={requiresApiKey}
          onVibeChange={actions.setVibe}
          onOpenSettings={() => actions.setIsSettingsOpen(true)}
          onTransmute={actions.handleTransmute}
        />
      )}

      {hasApiAccess && activePersona && !isBeginnerWorkspace && advancedWorkspaceVariant === 'major' && (
        <MajorWorkspace
          state={state}
          derived={derived}
          actions={actions}
          personaCapabilities={activePersonaCapabilities}
          showApiSettings={requiresApiKey}
        />
      )}

      {hasApiAccess && activePersona && !isBeginnerWorkspace && advancedWorkspaceVariant !== 'major' && (
        <ExperiencedWorkspace
          state={state}
          derived={derived}
          actions={actions}
          personaCapabilities={activePersonaCapabilities}
          showApiSettings={requiresApiKey}
        />
      )}

      <ApiKeyModal
        isOpen={state.isSettingsOpen}
        providerLabel={providerLabel}
        providerOptions={derived.providerOptions}
        selectedProvider={state.apiProvider}
        onProviderChange={actions.setApiProvider}
        modelOptions={state.modelOptions}
        selectedModel={state.selectedModel}
        isModelOptionsLoading={state.isModelOptionsLoading}
        onModelChange={actions.setSelectedModel}
        showApiKeyInput={requiresApiKey}
        tempKey={state.tempKey}
        onTempKeyChange={actions.setTempKey}
        onSave={actions.handleSaveKey}
        onClose={() => actions.setIsSettingsOpen(false)}
      />
    </main>
  );
}
