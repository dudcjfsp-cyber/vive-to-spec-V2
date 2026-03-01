import React from 'react';
import ControlPanel from './ControlPanel';
import ResultPanel from './ResultPanel';

export default function MajorWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
}) {
  return (
    <section className="major-workspace">
      <section className="panel persona-brief persona-brief-major">
        <div className="panel-head">
          <h2>Major Mode</h2>
          <p>정책 메타, 전체 레이어, 진단 상태를 그대로 유지한 채 세부 조정까지 직접 컨트롤합니다.</p>
        </div>
        <div className="signal-pills">
          <span className="pill">compact L4: OFF</span>
          <span className="pill">prompt meta: full</span>
          <span className="pill">flow: inspect -&gt; tune -&gt; export</span>
        </div>
      </section>

      <div className="layout-grid major-layout-grid">
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
            hybridStackGuide={state.hybridStackGuide}
            vibe={state.vibe}
            standardOutput={derived.standardOutput}
            nondevSpec={derived.nondevSpec}
            devSpec={derived.devSpec}
            masterPrompt={derived.masterPrompt}
            promptPolicyMeta={derived.promptPolicyMeta}
            personaCapabilities={personaCapabilities}
            onRefreshHybrid={actions.handleRefreshHybrid}
          />
        </div>
      </div>
    </section>
  );
}
