import React, { useEffect, useMemo, useState } from 'react';
import { PriorityActionList } from './PriorityActionList';
import ControlPanel from './ControlPanel';
import HybridStackGuidePanel from './HybridStackGuidePanel';
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

function renderSharedDiagnosticsLayout({
  state,
  derived,
  actions,
  personaCapabilities,
}) {
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
  );
}

export default function ExperiencedWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
  showModeIntro = true,
  compactMode = true,
}) {
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  useEffect(() => {
    setIsDiagnosticsOpen(!compactMode);
  }, [compactMode]);

  const todayActions = useMemo(
    () => toStringArray(derived.standardOutput?.오늘_할_일_3개).slice(0, 3),
    [derived.standardOutput],
  );
  const topWarnings = useMemo(
    () => toStringArray(derived.standardOutput?.완성도_진단?.누락_경고).slice(0, 2),
    [derived.standardOutput],
  );
  const quickRequest = useMemo(() => {
    const standardRequest = toText(derived.standardOutput?.수정요청_변환?.표준_요청);
    if (standardRequest) return standardRequest;
    return toText(derived.standardOutput?.수정요청_변환?.짧은_요청, derived.masterPrompt);
  }, [derived.masterPrompt, derived.standardOutput]);
  const completionScore = Number.isFinite(Number(derived.standardOutput?.완성도_진단?.점수_0_100))
    ? Number(derived.standardOutput?.완성도_진단?.점수_0_100)
    : null;

  if (!compactMode) {
    return (
      <section className="experienced-workspace">
        {renderSharedDiagnosticsLayout({
          state,
          derived,
          actions,
          personaCapabilities,
        })}
      </section>
    );
  }

  return (
    <section className="experienced-workspace">
      {showModeIntro && (
        <section className="panel persona-brief persona-brief-experienced">
          <div className="panel-head">
            <h2>Experienced Mode</h2>
            <p>핵심 경고와 실행 우선순위를 먼저 보고, 필요한 진단만 확장해서 정리합니다.</p>
          </div>
          <div className="signal-pills">
            <span className="pill">compact L4: ON</span>
            <span className="pill">prompt meta: summary only</span>
            <span className="pill">flow: input -&gt; summary -&gt; diagnostics</span>
          </div>
        </section>
      )}

      <div className="experienced-compact-grid">
        <section className="panel experienced-control-panel">
          <div className="panel-head">
            <h2>Fast Transmute</h2>
            <p>입력과 실행만 빠르게 처리하고, 세부 진단은 필요할 때만 확장합니다.</p>
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
            <label htmlFor="experienced-show-thinking">추론 레이어 포함</label>
          </div>

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

          <div className="stack-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={actions.handleTransmute}
              disabled={state.status === 'processing' || !state.vibe.trim()}
            >
              {state.status === 'processing' ? '요약 생성 중...' : '요약 생성'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => actions.setIsSettingsOpen(true)}>
              API 키 설정
            </button>
          </div>

          <p className="small-muted experienced-footer-note">
            모델: {state.activeModel} | 하이브리드 스택: {state.hybridStackGuideStatus}
          </p>
        </section>

        <section className="panel experienced-summary-panel">
          <div className="panel-head">
            <h2>Execution Snapshot</h2>
            <p>상위 경고, 즉시 실행 항목, 전달용 요청문만 먼저 확인합니다.</p>
          </div>

          {state.status === 'idle' && (
            <p className="experienced-empty-state">
              아직 요약이 없습니다. 요구를 입력하고 `요약 생성`을 눌러 상위 경고와 실행 항목을 먼저 확인하세요.
            </p>
          )}

          {state.status === 'processing' && (
            <p className="experienced-empty-state">상위 경고와 실행 스냅샷을 생성하는 중입니다.</p>
          )}

          {state.status === 'error' && (
            <p className="beginner-error">오류: {state.errorMessage || '알 수 없는 오류'}</p>
          )}

          {state.status === 'success' && (
            <div className="experienced-summary-stack">
              <div className="signal-pills">
                <span className="pill">model: {state.activeModel}</span>
                <span className="pill">hybrid: {state.hybridStackGuideStatus}</span>
                {completionScore !== null && <span className="pill">score: {completionScore}</span>}
              </div>

              <section className="experienced-summary-card">
                <h3>상위 점검 2개</h3>
                <ul className="experienced-summary-list">
                  {(topWarnings.length ? topWarnings : ['현재 즉시 차단 경고는 감지되지 않았습니다.'])
                    .slice(0, 2)
                    .map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
                </ul>
              </section>

              <section className="experienced-summary-card">
                <h3>바로 실행</h3>
                <PriorityActionList
                  items={todayActions}
                  maxItems={3}
                  emptyItemText="즉시 실행 항목이 아직 없습니다."
                />
              </section>

              <section className="experienced-summary-card">
                <h3>전달용 요청문</h3>
                <pre className="mono-block experienced-quick-request">
                  {quickRequest || '전달용 요청문이 아직 없습니다.'}
                </pre>
              </section>

              <section className="experienced-summary-card">
                <HybridStackGuidePanel
                  guide={state.hybridStackGuide}
                  status={state.hybridStackGuideStatus}
                  compact
                  title="추천 구현 스택"
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
              {isDiagnosticsOpen ? '상세 진단 닫기' : '상세 진단 열기'}
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
          })}
        </section>
      )}
    </section>
  );
}
