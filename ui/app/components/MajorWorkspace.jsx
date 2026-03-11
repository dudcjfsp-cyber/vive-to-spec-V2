import React, { useMemo } from 'react';
import AdvancedResultPane from './AdvancedResultPane.jsx';
import ControlPanel from './ControlPanel';
import WorkspaceStatusCard from './WorkspaceStatusCard.jsx';
import { buildAdvancedResultViewModel } from './result-panel/buildAdvancedResultViewModel.js';
import { buildMajorReviewModel } from './major-workspace/buildMajorReviewModel.js';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function getValidationSeverityLabel(severity) {
  const normalized = toText(severity, 'low').toLowerCase();
  if (normalized === 'high') return '높음';
  if (normalized === 'medium') return '보통';
  return '낮음';
}

const REVIEW_STEPS = [
  {
    title: '1. 차단 이슈',
    body: '지금 바로 막히는 계약/검증 문제부터 먼저 확인합니다.',
  },
  {
    title: '2. 계약과 영향',
    body: '필수 필드, 권한, 화면/테스트 영향 범위를 빠르게 훑습니다.',
  },
  {
    title: '3. 결과 확정',
    body: '검토 근거가 충분할 때만 상세 결과와 프롬프트를 확정합니다.',
  },
];

function buildMajorStatus(state) {
  if (state.status === 'processing') {
    return {
      tone: 'processing',
      title: '검토 근거 정리 중',
      body: '차단 이슈, 계약 안정성, 변경 영향 범위를 검토 순서에 맞춰 정리하고 있습니다.',
      items: ['차단 이슈 먼저 정리', '계약/필수 필드 점검', '화면/권한/테스트 영향 압축'],
    };
  }

  if (state.status === 'error') {
    return {
      tone: 'error',
      title: '검토 근거 생성 실패',
      body: `오류: ${state.errorMessage || '알 수 없는 오류'}`,
      items: ['입력 문장을 더 구체적으로 줄이기', 'API/provider 상태 확인하기', '검토용 결과 다시 생성하기'],
    };
  }

  return {
    tone: 'idle',
    title: '아직 검토 준비 전',
    body: '요구를 입력하고 변환을 시작하면, 구현 전에 봐야 할 차단 이슈와 계약/영향 근거가 먼저 정리됩니다.',
    items: ['차단 이슈부터 확인하기', '계약과 필수 필드 검토하기', '영향 범위 확인 후 결과 확정하기'],
  };
}

function buildMajorResultPanelStatus(state) {
  if (state.status === 'processing') {
    return {
      tone: 'processing',
      title: '검토 결과 준비 중',
      body: '차단 이슈와 검토 근거가 정리되면 오른쪽에 상세 검토판을 보여줍니다.',
      items: ['왼쪽 입력은 그대로 유지됩니다.', '결과 생성 후 검토 요약과 세부 작업판 표시'],
    };
  }

  if (state.status === 'error') {
    return {
      tone: 'error',
      title: '검토 결과를 아직 표시할 수 없음',
      body: `오류: ${state.errorMessage || '알 수 없는 오류'}`,
      items: ['왼쪽 요구를 조금 더 구체적으로 정리하세요.', '다시 변환을 실행한 뒤 상세 검토판을 확인하세요.'],
    };
  }

  return {
    tone: 'idle',
    title: '검토 결과는 생성 후 표시됩니다',
    body: '왼쪽에서 변환을 시작하면, 여기에서 차단 이슈, 검토 요약, 세부 작업판을 확인합니다.',
    items: ['먼저 요구를 입력하고 변환 시작', '생성 후 차단 이슈와 영향 범위 확인'],
  };
}

export default function MajorWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
  showApiSettings = true,
}) {
  const reviewModel = useMemo(
    () => buildMajorReviewModel({ state, derived }),
    [state.activeModel, derived.standardOutput, derived.validationReport],
  );
  const statusCard = buildMajorStatus(state);

  const reviewFlow = (
    <section className="panel major-review-flow">
      <div className="panel-head">
        <h2>검토 순서</h2>
        <p>이 모드는 구현보다 판단을 먼저 끝내는 흐름입니다.</p>
      </div>
      <div className="major-review-grid">
        {REVIEW_STEPS.map((step) => (
          <article key={step.title} className="major-review-step">
            <strong>{step.title}</strong>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );

  const engineeringOverview = (
    <section className="panel major-engineering-overview">
      <div className="panel-head">
        <h2>검토 우선 대시보드</h2>
        <p>직접 검토하고 통제하려는 작업 방식에 맞춰, 구현 전에 볼 리스크만 세 가지 축으로 압축했습니다. 먼저 볼 것만 확인하고, 자세한 근거는 필요할 때만 펼치면 됩니다.</p>
      </div>
      <div className="major-readiness-grid major-readiness-grid-compact">
        <article className="major-readiness-card">
          <h3>신뢰성</h3>
          <div className="signal-pills">
            <span className="pill">심각도: {getValidationSeverityLabel(reviewModel.validationSeverity)}</span>
            <span className="pill">경고: {reviewModel.reliability.warningCount}</span>
            <span className="pill">차단: {reviewModel.reliability.blockingCount}</span>
          </div>
          <p className="small-muted">먼저 볼 것</p>
          <ul className="major-readiness-list">
            {reviewModel.reliability.summaryItems.map((item, index) => <li key={`major-reliability-summary-${index}`}>{item}</li>)}
          </ul>
          <details className="major-readiness-details">
            <summary>예외 기준과 추가 이슈 {reviewModel.reliability.extraItems.length}개 보기</summary>
            <ul className="major-readiness-list compact">
              {reviewModel.reliability.extraItems.map((item, index) => <li key={`major-reliability-extra-${index}`}>{item}</li>)}
            </ul>
          </details>
        </article>

        <article className="major-readiness-card">
          <h3>계약 안정성</h3>
          <div className="signal-pills">
            <span className="pill">스키마 필드: {reviewModel.contract.fieldCount}</span>
            <span className="pill">필수: {reviewModel.contract.requiredFieldCount}</span>
            <span className="pill">모델: {reviewModel.contract.modelLabel}</span>
          </div>
          <p className="small-muted">먼저 볼 것</p>
          <ul className="major-readiness-list">
            {reviewModel.contract.summaryItems.map((item, index) => <li key={`major-contract-summary-${index}`}>{item}</li>)}
          </ul>
          {reviewModel.contract.extraItems.length > 0 && (
            <details className="major-readiness-details">
              <summary>나머지 필드 {reviewModel.contract.extraItems.length}개 보기</summary>
              <ul className="major-readiness-list compact">
                {reviewModel.contract.extraItems.map((item, index) => <li key={`major-contract-extra-${index}`}>{item}</li>)}
              </ul>
            </details>
          )}
        </article>

        <article className="major-readiness-card">
          <h3>변경 영향</h3>
          <div className="signal-pills">
            <span className="pill">화면: {reviewModel.impact.screenCount}</span>
            <span className="pill">권한: {reviewModel.impact.permissionCount}</span>
            <span className="pill">테스트: {reviewModel.impact.testCount}</span>
          </div>
          <p className="small-muted">먼저 볼 것</p>
          <ul className="major-readiness-list">
            {reviewModel.impact.summaryItems.map((item, index) => <li key={`major-impact-summary-${index}`}>{item}</li>)}
          </ul>
          {reviewModel.impact.extraItems.length > 0 && (
            <details className="major-readiness-details">
              <summary>추가 영향 {reviewModel.impact.extraItems.length}개 보기</summary>
              <ul className="major-readiness-list compact">
                {reviewModel.impact.extraItems.map((item, index) => <li key={`major-impact-extra-${index}`}>{item}</li>)}
              </ul>
            </details>
          )}
        </article>
      </div>
    </section>
  );

  return (
    <section className="major-workspace">
      <section className="panel persona-brief persona-brief-major">
        <div className="panel-head">
          <h2>검토 통제형 모드</h2>
          <p>구현 전에 차단 이슈, 계약, 영향 범위를 먼저 확인하고, 그다음에 결과와 프롬프트를 확정하는 작업 방식입니다.</p>
        </div>
        <div className="signal-pills">
          <span className="pill">판단 근거 우선</span>
          <span className="pill">계약/영향 검토</span>
          <span className="pill">순서: 검토 -&gt; 결정 -&gt; 결과 확정</span>
        </div>
        <p className="small-muted persona-mode-note">
          이 모드는 다른 모드보다 더 많이 설명하는 대신, 구현 전에 스스로 검토 근거를 확인하고 통제하는 작업 방식에 맞춰져 있습니다.
        </p>
      </section>

      {state.status !== 'success' && (
        <WorkspaceStatusCard
          tone={statusCard.tone}
          title={statusCard.title}
          body={statusCard.body}
          items={statusCard.items}
        />
      )}

      {reviewFlow}
      {state.status === 'success' && engineeringOverview}

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
            showApiSettings={showApiSettings}
            onOpenSettings={() => actions.setIsSettingsOpen(true)}
            onTransmute={actions.handleTransmute}
            clarifyApplyNotice={derived.clarifyApplyNotice}
          />
        </div>

        <div className="layout-right">
          <AdvancedResultPane
            statusCard={buildMajorResultPanelStatus(state)}
            resultViewModel={buildAdvancedResultViewModel({
              state,
              derived,
              personaCapabilities,
              actions,
            })}
          />
        </div>
      </div>
    </section>
  );
}
