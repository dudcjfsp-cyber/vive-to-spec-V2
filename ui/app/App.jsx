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
}) {
  return (
    <section className="panel api-key-gate">
      <div className="panel-head">
        <h2>1단계: API 키 연결</h2>
        <p>모드 선택 전에 API 키를 먼저 등록해야 변환을 시작할 수 있습니다.</p>
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
        API 키를 저장하면 바로 수준 선택 화면으로 이동합니다.
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
  const hasApiKey = Boolean(state.apiKey);
  const providerLabel = derived.providerOptions.find((item) => item.id === state.apiProvider)?.label || state.apiProvider;
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
    setPersonaId(nextPersonaId);
  };

  const handleResetPersona = () => {
    setPersonaId('');
    setIsBeginnerAdvancedOpen(false);
  };

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div>
          <p className="eyebrow">뉴럴 드래프트 콘솔</p>
          <h1>Vibe-to-Spec V2</h1>
          <p className="header-copy">
            {isBeginnerWorkspace
              ? '한 문장 입력으로 실행 가능한 초안을 빠르게 생성합니다.'
              : '아이디어를 실행 가능한 스펙으로 변환하는 AX 계획 코크핏.'}
          </p>
        </div>
        <div className="header-meta">
          <span className="status-chip">
            {hasApiKey ? (activePersona?.label || '시작 모드 선택 필요') : 'API 키 연결 필요'}
          </span>
          <span className="status-chip muted">상태 복원 활성화</span>
          {hasApiKey && activePersona && (
            <button type="button" className="btn btn-ghost btn-mini" onClick={handleResetPersona}>
              모드 다시 선택
            </button>
          )}
        </div>
      </header>

      {!hasApiKey && renderApiKeyGate({ state, derived, actions })}

      {hasApiKey && !activePersona && (
        <PersonaSelector
          presets={PERSONA_PRESETS}
          onSelectPersona={handleSelectPersona}
        />
      )}

      {hasApiKey && activePersona && isBeginnerWorkspace && (
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
              />
            </section>
          )}
        </>
      )}

      {hasApiKey && activePersona && !isBeginnerWorkspace && advancedWorkspaceVariant === 'major' && (
        <MajorWorkspace
          state={state}
          derived={derived}
          actions={actions}
          personaCapabilities={activePersonaCapabilities}
        />
      )}

      {hasApiKey && activePersona && !isBeginnerWorkspace && advancedWorkspaceVariant !== 'major' && (
        <ExperiencedWorkspace
          state={state}
          derived={derived}
          actions={actions}
          personaCapabilities={activePersonaCapabilities}
        />
      )}

      <ApiKeyModal
        isOpen={state.isSettingsOpen}
        providerLabel={providerLabel}
        tempKey={state.tempKey}
        onTempKeyChange={actions.setTempKey}
        onSave={actions.handleSaveKey}
        onClose={() => actions.setIsSettingsOpen(false)}
      />
    </main>
  );
}
