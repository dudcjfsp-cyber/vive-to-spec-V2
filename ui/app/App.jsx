import React from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import ControlPanel from './components/ControlPanel';
import ResultPanel from './components/ResultPanel';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const { state, derived, actions } = useAppController();
  const providerLabel = derived.providerOptions.find((item) => item.id === state.apiProvider)?.label || state.apiProvider;

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 16 }}>
      <header>
        <h1>Vibe-to-Spec V2</h1>
        <p>
          App composes UI only. Domain/state/storage logic is delegated to hook/services.
        </p>
      </header>

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

      <ApiKeyModal
        isOpen={state.isSettingsOpen}
        providerLabel={providerLabel}
        tempKey={state.tempKey}
        onTempKeyChange={actions.setTempKey}
        onSave={actions.handleSaveKey}
        onClose={() => actions.setIsSettingsOpen(false)}
      />

      <ResultPanel
        status={state.status}
        errorMessage={state.errorMessage}
        activeModel={state.activeModel}
        hybridStackGuideStatus={state.hybridStackGuideStatus}
        nondevSpec={derived.nondevSpec}
        devSpec={derived.devSpec}
        masterPrompt={derived.masterPrompt}
        onRefreshHybrid={actions.handleRefreshHybrid}
      />
    </main>
  );
}

