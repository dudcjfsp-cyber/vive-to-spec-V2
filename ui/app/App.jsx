import React, { useEffect, useMemo, useState } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import BeginnerWorkspace from './components/BeginnerWorkspace';
import ExperiencedWorkspace from './components/ExperiencedWorkspace';
import MajorWorkspace from './components/MajorWorkspace';
import PersonaSelector from './components/PersonaSelector';
import { useAppController } from './hooks/useAppController';
import { PERSONA_PRESETS, resolvePersonaPreset, resolvePersonaRuntimeConfig } from './persona/presets';

const PERSONA_STORAGE_KEY = 'vibe_to_spec_persona';

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
  const [isBeginnerAdvancedOpen, setIsBeginnerAdvancedOpen] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activePersona) {
      window.sessionStorage.setItem(PERSONA_STORAGE_KEY, activePersona.id);
    } else {
      window.sessionStorage.removeItem(PERSONA_STORAGE_KEY);
    }
  }, [activePersona]);

  useEffect(() => {
    if (!isBeginnerWorkspace) {
      setIsBeginnerAdvancedOpen(false);
      return;
    }

    setIsBeginnerAdvancedOpen(Boolean(activePersonaCapabilities.defaultBeginnerAdvancedOpen));
  }, [
    activePersonaConfig.id,
    activePersonaCapabilities.defaultBeginnerAdvancedOpen,
    isBeginnerWorkspace,
  ]);

  const handleSelectPersona = (nextPersonaId) => {
    if (state.status === 'processing') return;
    setPersonaId(nextPersonaId);
  };

  const handleResetPersona = () => {
    if (state.status === 'processing') return;
    setPersonaId('');
    setIsBeginnerAdvancedOpen(false);
  };

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div>
          <p className="eyebrow">학습 스펙 워크스페이스</p>
          <h1>Vibe-to-Spec V2</h1>
          <p className="header-copy">
            {activePersona
              ? (isBeginnerWorkspace
                ? '한 문장 입력으로 실행 가능한 초안을 빠르게 생성합니다.'
                : '아이디어를 실행 가능한 스펙으로 단계별 정리하는 교육형 워크스페이스.')
              : (requiresApiKey
                ? '세션을 먼저 고르고, 바로 같은 화면에서 API 연결과 작업 시작까지 이어집니다.'
                : '세션을 먼저 고르고 바로 작업을 시작합니다.')}
          </p>
        </div>
        <div className="header-meta">
          <span className="status-chip">
            세션: {activePersona?.label || '선택 전'}
          </span>
          <span className={`status-chip ${hasApiAccess ? '' : 'muted'}`}>
            API: {apiStatusLabel}
          </span>
          <span className="status-chip muted">상태 복원 활성화</span>
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
            <p>위에서 입문자, 경험자, 전공자 중 하나를 고르면 같은 상태를 유지한 채 바로 작업 화면으로 전환됩니다.</p>
          </div>
        </section>
      )}

      {hasApiAccess && activePersona && isBeginnerWorkspace && (
        <>
          <BeginnerWorkspace
            vibe={state.vibe}
            status={state.status}
            errorMessage={state.errorMessage}
            standardOutput={derived.standardOutput}
            masterPrompt={derived.masterPrompt}
            promptPolicyMeta={derived.promptPolicyMeta}
            apiProvider={state.apiProvider}
            providerOptions={derived.providerOptions}
            modelOptions={state.modelOptions}
            selectedModel={state.selectedModel}
            isModelOptionsLoading={state.isModelOptionsLoading}
            showThinking={state.showThinking}
            showPromptPolicyMeta={activePersonaCapabilities.showPromptPolicyMeta}
            allowAdvancedToggle={activePersonaCapabilities.allowBeginnerAdvancedToggle}
            showApiSettings={requiresApiKey}
            onVibeChange={actions.setVibe}
            onProviderChange={actions.setApiProvider}
            onModelChange={actions.setSelectedModel}
            onShowThinkingChange={actions.setShowThinking}
            onOpenSettings={() => actions.setIsSettingsOpen(true)}
            onTransmute={actions.handleTransmute}
            isAdvancedOpen={isBeginnerAdvancedOpen}
            onToggleAdvanced={() => setIsBeginnerAdvancedOpen((prev) => !prev)}
          />
          {isBeginnerAdvancedOpen && (
            <section className="beginner-advanced-wrap">
              <ExperiencedWorkspace
                state={state}
                derived={derived}
                actions={actions}
                personaCapabilities={activePersonaCapabilities}
                showModeIntro={false}
                compactMode={false}
                showApiSettings={requiresApiKey}
              />
            </section>
          )}
        </>
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

      {requiresApiKey && (
        <ApiKeyModal
          isOpen={state.isSettingsOpen}
          providerLabel={providerLabel}
          tempKey={state.tempKey}
          onTempKeyChange={actions.setTempKey}
          onSave={actions.handleSaveKey}
          onClose={() => actions.setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}

