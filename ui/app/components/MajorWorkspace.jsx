import React, { useMemo } from 'react';
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

function toObjectArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object');
}

function formatBlockingIssue(issue, index) {
  if (!issue || typeof issue !== 'object') return `차단 이슈 ${index + 1}`;
  return toText(issue.message, toText(issue.id, `차단 이슈 ${index + 1}`));
}

function isRequiredField(value) {
  if (value === true) return true;
  const text = toText(value).toLowerCase();
  if (!text) return false;
  return ['required', 'yes', 'true', 'y', '필수'].some((token) => text.includes(token));
}

export default function MajorWorkspace({
  state,
  derived,
  actions,
  personaCapabilities,
  showApiSettings = true,
}) {
  const schemaWarnings = useMemo(
    () => toStringArray(derived.standardOutput?.완성도_진단?.누락_경고).slice(0, 3),
    [derived.standardOutput],
  );
  const inputFields = useMemo(
    () => toObjectArray(derived.standardOutput?.입력_데이터_필드).slice(0, 5),
    [derived.standardOutput],
  );
  const requiredFieldCount = useMemo(
    () => inputFields.filter((field) => isRequiredField(field?.필수)).length,
    [inputFields],
  );
  const validationSeverity = toText(derived.validationReport?.severity, 'low');
  const blockingIssues = useMemo(() => {
    if (!Array.isArray(derived.validationReport?.blocking_issues)) return [];
    return derived.validationReport.blocking_issues
      .map((issue, index) => formatBlockingIssue(issue, index))
      .filter(Boolean)
      .slice(0, 3);
  }, [derived.validationReport]);
  const impactPreview = useMemo(() => ({
    screens: toStringArray(derived.standardOutput?.변경_영향도?.화면).slice(0, 3),
    permissions: toStringArray(derived.standardOutput?.변경_영향도?.권한).slice(0, 3),
    tests: toStringArray(derived.standardOutput?.변경_영향도?.테스트).slice(0, 3),
  }), [derived.standardOutput]);

  const exceptionPolicies = useMemo(() => [
    '검증 실패: 입력 필드 단위로 즉시 오류를 반환하고 재시도는 수행하지 않습니다.',
    '외부 API 실패/타임아웃: 1회 재시도 후 실패 원인을 로그와 사용자 메시지로 분리합니다.',
    '권한 충돌: 삭제 작업은 승인 단계 이후에만 실행하도록 보호 규칙을 강제합니다.',
  ], []);

  const engineeringOverview = (
    <section className="panel major-engineering-overview">
      <div className="panel-head">
        <h2>엔지니어링 준비도</h2>
        <p>전공자 세션에서 실제 구현 전에 꼭 확인할 리스크만 세 가지 축으로 압축했습니다.</p>
      </div>
      <div className="major-readiness-grid major-readiness-grid-compact">
        <article className="major-readiness-card">
          <h3>신뢰성</h3>
          <div className="signal-pills">
            <span className="pill">심각도: {validationSeverity}</span>
            <span className="pill">경고: {schemaWarnings.length}</span>
            <span className="pill">차단: {blockingIssues.length}</span>
          </div>
          <p className="small-muted">엣지케이스 및 예외 처리 기준</p>
          <ul className="major-readiness-list">
            {(schemaWarnings.length > 0 ? schemaWarnings : ['현재 감지된 스키마 경고가 없습니다.'])
              .slice(0, 3)
              .map((item, index) => <li key={`major-reliability-warning-${index}`}>{item}</li>)}
          </ul>
          <ul className="major-readiness-list compact">
            {exceptionPolicies.slice(0, 2).map((item, index) => <li key={`major-exception-${index}`}>{item}</li>)}
          </ul>
        </article>

        <article className="major-readiness-card">
          <h3>계약 안정성</h3>
          <div className="signal-pills">
            <span className="pill">스키마 필드: {inputFields.length}</span>
            <span className="pill">필수: {requiredFieldCount}</span>
            <span className="pill">모델: {state.activeModel}</span>
          </div>
          <p className="small-muted">입력 필드와 권한/계약 범위를 빠르게 훑습니다.</p>
          <ul className="major-readiness-list">
            {(inputFields.length > 0
              ? inputFields.map((field) => {
                const name = toText(field?.이름, '필드');
                const type = toText(field?.타입, 'string');
                const requiredLabel = isRequiredField(field?.필수) ? '필수' : '선택';
                return `${name} (${type}, ${requiredLabel})`;
              })
              : ['입력 데이터 필드가 아직 정의되지 않았습니다.'])
              .slice(0, 5)
              .map((item, index) => <li key={`major-contract-field-${index}`}>{item}</li>)}
          </ul>
        </article>

        <article className="major-readiness-card">
          <h3>변경 영향</h3>
          <div className="signal-pills">
            <span className="pill">화면: {impactPreview.screens.length}</span>
            <span className="pill">권한: {impactPreview.permissions.length}</span>
            <span className="pill">테스트: {impactPreview.tests.length}</span>
          </div>
          <p className="small-muted">변경 전에 확인할 영향 범위를 빠르게 압축합니다.</p>
          <ul className="major-readiness-list">
            {(impactPreview.screens.length > 0
              ? impactPreview.screens.map((item) => `화면: ${item}`)
              : ['화면 영향 정보가 아직 없습니다.'])
              .slice(0, 3)
              .map((item, index) => <li key={`major-impact-screen-${index}`}>{item}</li>)}
          </ul>
          <ul className="major-readiness-list compact">
            {(impactPreview.permissions.length > 0
              ? impactPreview.permissions.map((item) => `권한: ${item}`)
              : ['권한 영향 정보가 아직 없습니다.'])
              .slice(0, 2)
              .map((item, index) => <li key={`major-impact-permission-${index}`}>{item}</li>)}
            {(impactPreview.tests.length > 0
              ? impactPreview.tests.map((item) => `테스트: ${item}`)
              : ['테스트 영향 정보가 아직 없습니다.'])
              .slice(0, 2)
              .map((item, index) => <li key={`major-impact-test-${index}`}>{item}</li>)}
          </ul>
        </article>
      </div>
    </section>
  );

  return (
    <section className="major-workspace">
      <section className="panel persona-brief persona-brief-major">
        <div className="panel-head">
          <h2>전공자 모드</h2>
          <p>기본 화면에는 바로 쓰는 결과와 엔지니어링 준비도만 먼저 두고, 참고 정보는 아래로 접어 정리했습니다.</p>
        </div>
        <div className="signal-pills">
          <span className="pill">기본 출력 우선</span>
          <span className="pill">보조 정보는 접힘</span>
          <span className="pill">흐름: 복사 -&gt; 판단 -&gt; 참고</span>
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
            clarifyLoop={derived.clarifyLoop}
            clarifyApplyNotice={derived.clarifyApplyNotice}
            personaCapabilities={personaCapabilities}
            onRefreshHybrid={actions.handleRefreshHybrid}
            onSyncWarningToClarify={actions.syncWarningToClarifyLoop}
            onSetClarifyAnswer={actions.setClarifyAnswer}
            onRemoveClarifyQuestion={actions.removeClarifyQuestion}
            onApplyClarifications={actions.handleApplyClarifications}
            onClearClarifyQuestions={actions.clearClarifyQuestions}
          />
        </div>
      </div>

      {engineeringOverview}
    </section>
  );
}

