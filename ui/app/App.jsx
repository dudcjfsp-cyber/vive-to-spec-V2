import React from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import ControlPanel from './components/ControlPanel';
import ResultPanel from './components/ResultPanel';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const { state, derived, actions } = useAppController();
  const providerLabel = derived.providerOptions.find((item) => item.id === state.apiProvider)?.label || state.apiProvider;

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div>
          <p className="eyebrow">뉴럴 드래프트 콘솔</p>
          <h1>Vibe-to-Spec V2</h1>
          <p className="header-copy">
            아이디어를 실행 가능한 스펙으로 변환하는 AX 계획 코크핏.
          </p>
        </div>
        <div className="header-meta">
          <span className="status-chip">AX 레이어 파이프라인</span>
          <span className="status-chip muted">상태 복원 활성화</span>
        </div>
      </header>

      <div className="layout-grid">
        <div className="layout-left">
          <ControlPanel
            vibe={state.vibe}
            status={state.status}
            apiProvider={state.apiProvider}
            providerOptions={derived.providerOptions}
            modelOptions={state.modelOptions}
            selectedModel={state.selectedModel}
            isModelOptionsLoading={state.isModelOptionsLoading}
            showThinking={state.showThinking}
            onVibeChange={actions.setVibe}
            onProviderChange={actions.setApiProvider}
            onModelChange={actions.setSelectedModel}
            onShowThinkingChange={actions.setShowThinking}
            onOpenSettings={() => actions.setIsSettingsOpen(true)}
            onTransmute={actions.handleTransmute}
          />
        </div>

        <div className="layout-right">
          <ResultPanel
            status={state.status}
            errorMessage={state.errorMessage}
            activeModel={state.activeModel}
            hybridStackGuideStatus={state.hybridStackGuideStatus}
            vibe={state.vibe}
            standardOutput={derived.standardOutput}
            nondevSpec={derived.nondevSpec}
            devSpec={derived.devSpec}
            masterPrompt={derived.masterPrompt}
            onRefreshHybrid={actions.handleRefreshHybrid}
          />
        </div>
      </div>

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
