import React from 'react';
import ControlPanel from './ControlPanel';
import ResultPanel from './ResultPanel';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

export default function MajorWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
}) {
  const validationSeverity = toText(derived.validationReport?.severity, 'low');
  const blockingIssues = Array.isArray(derived.validationReport?.blocking_issues)
    ? derived.validationReport.blocking_issues
    : [];
  const validationQuestions = toStringArray(derived.clarifyLoop?.questions);

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
          {derived.validationReport && (
            <section className="panel">
              <div className="panel-head">
                <h2>Manual Loop Console</h2>
                <p>검증 리포트를 보고 보완 질문을 직접 조정한 뒤, 원하는 시점에 재생성합니다.</p>
              </div>
              <div className="signal-pills">
                <span className="pill">validation: {validationSeverity}</span>
                <span className="pill">blocking: {Number(derived.validationReport?.blocking_issue_count || 0)}</span>
                <span className="pill">warnings: {Number(derived.validationReport?.warning_count || 0)}</span>
                <span className="pill">turn: {Number(derived.clarifyLoop?.loopTurn || 0)}</span>
              </div>

              {blockingIssues.length > 0 && (
                <div>
                  <strong>핵심 차단 이슈</strong>
                  <ul>
                    {blockingIssues.map((issue) => (
                      <li key={issue.id || issue.message}>{toText(issue.message, issue.id)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationQuestions.length > 0 ? (
                <div className="form-group">
                  <strong>보완 질문 직접 조정</strong>
                  {validationQuestions.map((question) => (
                    <div key={question} className="form-group">
                      <label>{question}</label>
                      <textarea
                        rows={2}
                        value={toText(derived.clarifyLoop?.answers?.[question])}
                        onChange={(event) => actions.setClarifyAnswer(question, event.target.value)}
                        placeholder="확정된 정보만 입력하세요."
                        disabled={state.status === 'processing'}
                      />
                      <div className="stack-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-mini"
                          onClick={() => actions.removeClarifyQuestion(question)}
                          disabled={state.status === 'processing'}
                        >
                          이 질문 제외
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="small-muted">현재 수동 보완이 필요한 질문이 없습니다.</p>
              )}

              <div className="stack-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={actions.handleApplyClarifications}
                  disabled={state.status === 'processing' || derived.clarifyLoop?.canSubmit !== true}
                >
                  보완 반영 후 재생성
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={actions.clearClarifyQuestions}
                  disabled={state.status === 'processing' || validationQuestions.length === 0}
                >
                  이번 질문 건너뛰기
                </button>
              </div>
            </section>
          )}

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
            validationReport={derived.validationReport}
            clarifyLoop={derived.clarifyLoop}
            personaCapabilities={personaCapabilities}
            onRefreshHybrid={actions.handleRefreshHybrid}
            onSyncWarningToClarify={actions.syncWarningToClarifyLoop}
          />
        </div>
      </div>
    </section>
  );
}
