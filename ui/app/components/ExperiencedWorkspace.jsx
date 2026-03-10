import React, { useEffect, useState } from 'react';
import { PriorityActionList } from './PriorityActionList';
import ControlPanel from './ControlPanel';
import HybridStackGuidePanel from './HybridStackGuidePanel';
import ResultPanel from './ResultPanel';
import WorkspaceStatusCard from './WorkspaceStatusCard.jsx';
import { useExperiencedSummary } from './hooks/useExperiencedSummary.js';

function renderSharedDiagnosticsLayout({
  state,
  derived,
  actions,
  personaCapabilities,
  showApiSettings,
  selectedImplementationStack,
  onSelectImplementationStack,
}) {
  const diagnosticsCapabilities = {
    ...(personaCapabilities && typeof personaCapabilities === 'object' ? personaCapabilities : {}),
    showCompactDeliveryPanel: false,
    showLayerL1Panel: false,
    showLayerL2Panel: false,
    showLayerOutputPanel: false,
    showCtaHistory: false,
    allowIntegrityActions: false,
    allowExecutionActions: false,
  };

  return (
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
          showApiSettings={showApiSettings}
          onOpenSettings={() => actions.setIsSettingsOpen(true)}
          onTransmute={actions.handleTransmute}
          clarifyApplyNotice={derived.clarifyApplyNotice}
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
          validationReport={derived.validationReport}
          clarifyApplyNotice={derived.clarifyApplyNotice}
          selectedImplementationStack={selectedImplementationStack}
          onSelectImplementationStack={onSelectImplementationStack}
          personaCapabilities={diagnosticsCapabilities}
          onRefreshHybrid={actions.handleRefreshHybrid}
        />
      </div>
    </div>
  );
}

const QUICK_MODE_STEPS = [
  {
    title: '1. 바로 실행',
    body: '오늘 할 일 3개와 전달용 요청문부터 먼저 확인합니다.',
  },
  {
    title: '2. 핵심 경고만',
    body: '상위 경고 2개만 보고 지금 막히는지만 판단합니다.',
  },
  {
    title: '3. 막히면 한 번 보완',
    body: '누락 정보가 있을 때만 짧게 답하고 다시 생성합니다.',
  },
];

function buildExperiencedStatus(state) {
  if (state.status === 'processing') {
    return {
      tone: 'processing',
      title: '실행 요약 정리 중',
      body: '핵심 실행 카드, 상위 경고, 한 번 보완할 질문만 추려서 정리하고 있습니다.',
      items: ['오늘 할 일 3개 정리', '상위 경고 2개 추리기', '필요할 때만 1회 보완 질문 만들기'],
    };
  }

  if (state.status === 'error') {
    return {
      tone: 'error',
      title: '실행 요약 생성 실패',
      body: `오류: ${state.errorMessage || '알 수 없는 오류'}`,
      items: ['입력 문장을 조금 더 짧고 명확하게 적기', '프로바이더/모델 설정 확인하기', '다시 요약 생성 시도하기'],
    };
  }

  return {
    tone: 'idle',
    title: '아직 빠른 실행 요약 전',
    body: '요구를 입력하고 요약 생성 버튼을 누르면, 오늘 바로 실행할 카드와 핵심 경고만 먼저 정리됩니다.',
    items: ['오늘 할 일 3개 먼저 보기', '상위 경고 2개만 빠르게 확인하기', '막힐 때만 한 번 보완하기'],
  };
}

export default function ExperiencedWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
  showModeIntro = true,
  compactMode = true,
  showApiSettings = true,
}) {
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [selectedImplementationStack, setSelectedImplementationStack] = useState(null);

  useEffect(() => {
    setIsDiagnosticsOpen(!compactMode);
  }, [compactMode]);

  const {
    todayActions,
    topWarnings,
    quickRequest,
    quickAiPrompt,
    promptCopyStatus,
    handleCopyExperiencedPrompt,
    completionScore,
    validationSeverity,
    validationQuestions,
    canSubmitClarification,
  } = useExperiencedSummary({
    derived,
    selectedImplementationStack,
  });
  const statusCard = buildExperiencedStatus(state);

  if (!compactMode) {
    return (
      <section className="experienced-workspace">
        {renderSharedDiagnosticsLayout({
          state,
          derived,
          actions,
          personaCapabilities,
          showApiSettings,
          selectedImplementationStack,
          onSelectImplementationStack: setSelectedImplementationStack,
        })}
      </section>
    );
  }

  return (
    <section className="experienced-workspace">
      {showModeIntro && (
        <section className="panel persona-brief persona-brief-experienced">
          <div className="panel-head">
            <h2>빠른 실행형 모드</h2>
            <p>오늘 바로 돌릴 결과와 핵심 경고만 먼저 확인하고, 세부 진단은 필요할 때만 여는 작업 방식입니다.</p>
          </div>
          <div className="signal-pills">
            <span className="pill">task workbench: ON</span>
            <span className="pill">top issues only</span>
            <span className="pill">flow: run -&gt; check -&gt; expand</span>
          </div>
          <p className="small-muted persona-mode-note">
            입문자에서 구조가 잡혔다면, 이제는 핵심 경고와 실행 순서만 빠르게 확인하는 단계입니다.
          </p>
        </section>
      )}

      <div className="experienced-compact-grid">
        <section className="panel experienced-control-panel">
          <div className="panel-head">
            <h2>빠른 정리</h2>
            <p>입력과 실행을 먼저 끝내고, 세부 검토는 정말 필요할 때만 확장합니다.</p>
          </div>

          <div className="control-grid">
            <div className="form-group">
              <label htmlFor="experienced-provider">프로바이더</label>
              <select
                id="experienced-provider"
                value={state.apiProvider}
                onChange={(event) => actions.setApiProvider(event.target.value)}
                disabled={state.status === 'processing'}
              >
                {derived.providerOptions.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="experienced-model">모델</label>
              <select
                id="experienced-model"
                value={state.selectedModel}
                onChange={(event) => actions.setSelectedModel(event.target.value)}
                disabled={state.status === 'processing' || state.isModelOptionsLoading || state.modelOptions.length === 0}
              >
                {state.modelOptions.length === 0 && <option value="">모델 없음</option>}
                {state.modelOptions.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="checkbox-row">
            <input
              id="experienced-show-thinking"
              type="checkbox"
              checked={state.showThinking}
              onChange={(event) => actions.setShowThinking(event.target.checked)}
              disabled={state.status === 'processing'}
            />
            <label htmlFor="experienced-show-thinking">사고 정리 레이어 포함</label>
          </div>
          <p className="small-muted">
            모델 내부 추론 전체를 여는 기능이 아니라, 결과 해석용 요약 레이어를 함께 보는 옵션입니다.
          </p>

          <div className="form-group">
            <label htmlFor="experienced-vibe">핵심 요구</label>
            <textarea
              id="experienced-vibe"
              rows={7}
              value={state.vibe}
              onChange={(event) => actions.setVibe(event.target.value)}
              placeholder="핵심 목표와 변경 포인트만 짧게 적으세요."
              disabled={state.status === 'processing'}
            />
          </div>

          {derived.clarifyApplyNotice && (
            <p className="small-muted matrix-notice">{derived.clarifyApplyNotice}</p>
          )}

          <div className="stack-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={actions.handleTransmute}
              disabled={state.status === 'processing' || !state.vibe.trim()}
            >
              {state.status === 'processing' ? '요약 생성 중...' : '요약 생성'}
            </button>
            {showApiSettings && (
              <button type="button" className="btn btn-ghost" onClick={() => actions.setIsSettingsOpen(true)}>
                API 키 설정
              </button>
            )}
          </div>

          <p className="small-muted experienced-footer-note">
            모델: {state.activeModel} | 하이브리드 스택: {state.hybridStackGuideStatus}
          </p>
        </section>

        <section className="panel experienced-summary-panel">
          <div className="panel-head">
            <h2>오늘 바로 끝내기</h2>
            <p>핵심 실행 카드만 먼저 남기고, 나머지는 필요할 때만 여는 요약 화면입니다.</p>
          </div>

          <section className="experienced-focus-strip">
            <div className="experienced-focus-grid">
              {QUICK_MODE_STEPS.map((step) => (
                <article key={step.title} className="experienced-focus-card">
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          {state.status !== 'success' && (
            <WorkspaceStatusCard
              tone={statusCard.tone}
              title={statusCard.title}
              body={statusCard.body}
              items={statusCard.items}
            />
          )}

          {state.status === 'success' && (
            <div className="experienced-summary-stack">
              <div className="signal-pills">
                <span className="pill">model: {state.activeModel}</span>
                <span className="pill">hybrid: {state.hybridStackGuideStatus}</span>
                {completionScore !== null && <span className="pill">score: {completionScore}</span>}
                {derived.validationReport && <span className="pill">validation: {validationSeverity}</span>}
              </div>

              <section className="experienced-summary-card experienced-priority-card">
                <h3>바로 실행</h3>
                <PriorityActionList
                  items={todayActions}
                  maxItems={3}
                  emptyItemText="즉시 실행 항목이 아직 없습니다."
                />
              </section>

              <section className="experienced-summary-card experienced-priority-card">
                <h3>상위 경고 2개</h3>
                <ul className="experienced-summary-list">
                  {(topWarnings.length ? topWarnings : ['현재 즉시 차단 경고는 감지되지 않았습니다.'])
                    .slice(0, 2)
                    .map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
                </ul>
              </section>

              {validationQuestions.length > 0 && (
                <section className="experienced-summary-card experienced-priority-card">
                  <h3>막히면 한 번만 보완</h3>
                  <p className="small-muted">
                    현재 결과의 누락 항목만 짧게 채우고, 반영 후 다시 직접 생성합니다.
                  </p>
                  <div className="stack-actions">
                    <span className="pill">turn: {Number(derived.clarifyLoop?.loopTurn || 0)}</span>
                    <span className="pill">questions: {validationQuestions.length}</span>
                  </div>
                  <div className="form-group">
                    {validationQuestions.map((question) => (
                      <div key={question} className="form-group">
                        <label>{question}</label>
                        <textarea
                          rows={2}
                          value={typeof derived.clarifyLoop?.answers?.[question] === 'string' ? derived.clarifyLoop.answers[question] : ''}
                          onChange={(event) => actions.setClarifyAnswer(question, event.target.value)}
                          placeholder="확정된 정보만 짧게 입력하세요."
                          disabled={state.status === 'processing'}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="stack-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={actions.handleApplyClarifications}
                      disabled={state.status === 'processing' || !canSubmitClarification}
                    >
                      입력 매트릭스 반영
                    </button>
                  </div>
                </section>
              )}

              <section className="experienced-summary-card">
                <h3>전달용 요청문</h3>
                {selectedImplementationStack && (
                  <div className="signal-pills compact-delivery-meta">
                    <span className="pill">선택 스택: {selectedImplementationStack.name}</span>
                  </div>
                )}
                <pre className="mono-block experienced-quick-request">
                  {quickRequest || '전달용 요청문이 아직 없습니다.'}
                </pre>
              </section>

              <section className="experienced-summary-card">
                <div className="compact-delivery-head">
                  <div>
                    <h3>AI에 넣을 프롬프트</h3>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleCopyExperiencedPrompt}>
                    프롬프트 복사
                  </button>
                </div>
                {selectedImplementationStack && (
                  <div className="signal-pills compact-delivery-meta">
                    <span className="pill">선택 스택: {selectedImplementationStack.name}</span>
                  </div>
                )}
                <pre className="mono-block compact-delivery-block">
                  {quickAiPrompt || 'AI에 넣을 프롬프트가 아직 없습니다.'}
                </pre>
                <p className="small-muted compact-delivery-status">{promptCopyStatus || '아직 복사 전'}</p>
              </section>

              <section className="experienced-summary-card">
                <HybridStackGuidePanel
                  guide={state.hybridStackGuide}
                  status={state.hybridStackGuideStatus}
                  compact
                  title="추천 구현 스택"
                  selectedStackId={selectedImplementationStack?.id || ''}
                  onSelectStack={setSelectedImplementationStack}
                />
              </section>
            </div>
          )}

          <div className="stack-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDiagnosticsOpen((prev) => !prev)}
            >
              {isDiagnosticsOpen ? '세부 진단 닫기' : '세부 진단은 필요할 때만 열기'}
            </button>
            {state.status === 'success' && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={actions.handleRefreshHybrid}
              >
                하이브리드 가이드 새로고침
              </button>
            )}
          </div>
        </section>
      </div>

      {isDiagnosticsOpen && (
        <section className="experienced-diagnostics-wrap">
          {renderSharedDiagnosticsLayout({
            state,
            derived,
            actions,
            personaCapabilities,
            showApiSettings,
            selectedImplementationStack,
            onSelectImplementationStack: setSelectedImplementationStack,
          })}
        </section>
      )}
    </section>
  );
}
