import React, { useState } from 'react';
import { ActionPriorityLegend, PriorityActionList } from '../../PriorityActionList';
import { GATE_STATUS_META, WARNING_DOMAIN_LABEL } from '../constants';
import { isObject, toText } from '../utils';

export function L4IntegritySimulator({
  gateStatus,
  integritySignals,
  topWarnings,
  remainingWarnings,
  warningSummary,
  compactMode = false,
  canSyncToManualLoop = false,
  allowActions = true,
  onWarningAction,
  onApplyAutoFixes,
}) {
  const gateMeta = GATE_STATUS_META[gateStatus] || GATE_STATUS_META.pass;
  const severitySummary = Object.entries(isObject(warningSummary?.bySeverity) ? warningSummary.bySeverity : {})
    .map(([severity, count]) => `${severity} ${count}`)
    .join(' | ');
  const [isHiddenWarningsOpen, setIsHiddenWarningsOpen] = useState(false);

  return (
    <section>
      <h3>핵심 경고와 무결성</h3>
      <p>
        상태: <strong>{gateMeta.label}</strong>
        {' | '}
        우선 경고 {topWarnings.length}개 노출
        {compactMode ? ' (요약형)' : ' (점수 상위)'}
      </p>
      <p className="small-muted">{gateMeta.message}</p>
      <div className="signal-pills">
        <span className="pill">
          데이터 흐름: {integritySignals.dataFlow}
        </span>
        <span className="pill">
          권한: {integritySignals.permission}
        </span>
        <span className="pill">
          정합성: {integritySignals.coherence}
        </span>
      </div>
      {compactMode && (
        <>
          <div className="signal-pills">
            <span className="pill">
              총 경고: {Number(warningSummary?.total) || 0}
            </span>
            <span className="pill">
              하드 차단: {Number(warningSummary?.hardBlockCount) || 0}
            </span>
            <button
              type="button"
              className={`pill pill-button hidden-warning-toggle ${isHiddenWarningsOpen ? 'is-active' : ''}`}
              onClick={() => setIsHiddenWarningsOpen((current) => !current)}
              disabled={remainingWarnings.length === 0}
              aria-expanded={isHiddenWarningsOpen}
            >
              {isHiddenWarningsOpen ? '숨김 경고 접기' : `숨김 경고 ${remainingWarnings.length}개 보기`}
            </button>
          </div>
          {severitySummary && (
            <p className="small-muted">
              심각도 분포: {severitySummary}
            </p>
          )}
          {remainingWarnings.length > 0 && (
            <p className="small-muted">
              요약형 모드에서는 상위 경고만 펼쳐서 보여줍니다. 나머지 {remainingWarnings.length}개는 상위 경고 처리 후 확인하세요.
            </p>
          )}
        </>
      )}
      {topWarnings.length === 0 && <p>즉시 차단 경고가 없습니다. 실행 준비로 넘어가도 됩니다.</p>}
      {topWarnings.map((warning) => (
        <article key={warning.id} className="warning-card">
          <strong className="warning-title">{warning.title}</strong>
          <p className="warning-meta">
            {warning.severity.toUpperCase()} | {WARNING_DOMAIN_LABEL[warning.domain] || warning.domain} | score {warning.score}
          </p>
          <p>{warning.detail}</p>
          {allowActions && (
            <div className="stack-actions">
              {canSyncToManualLoop && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onWarningAction(warning.id, 'send-to-clarify')}
                >
                  수동 루프로 보내기
                </button>
              )}
              {warning.actions.map((action) => (
                <button
                  key={`${warning.id}-${action.id}`}
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onWarningAction(warning.id, action.id)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
      {compactMode && isHiddenWarningsOpen && remainingWarnings.length > 0 && (
        <div className="hidden-warning-list">
          <p className="small-muted hidden-warning-summary">숨겨졌던 경고 {remainingWarnings.length}개를 모두 펼쳐서 보여줍니다.</p>
          {remainingWarnings.map((warning) => (
            <article key={warning.id} className="warning-card warning-card-muted">
              <strong className="warning-title">{warning.title}</strong>
              <p className="warning-meta">
                {warning.severity.toUpperCase()} | {WARNING_DOMAIN_LABEL[warning.domain] || warning.domain} | score {warning.score}
              </p>
              <p>{warning.detail}</p>
              {allowActions && (
                <div className="stack-actions">
                  {canSyncToManualLoop && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onWarningAction(warning.id, 'send-to-clarify')}
                    >
                      수동 루프로 보내기
                    </button>
                  )}
                  {warning.actions.map((action) => (
                    <button
                      key={`${warning.id}-${action.id}`}
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onWarningAction(warning.id, action.id)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {!compactMode && remainingWarnings.length > 0 && (
        <details>
          <summary>자세히 보기 ({remainingWarnings.length})</summary>
          <ul>
            {remainingWarnings.map((warning) => (
              <li key={warning.id}>
                {warning.title} (score {warning.score})
              </li>
            ))}
          </ul>
        </details>
      )}
      {allowActions && (
        <button type="button" className="btn btn-primary" onClick={onApplyAutoFixes} disabled={topWarnings.length === 0}>
          자동 보정 제안 적용
        </button>
      )}
    </section>
  );
}

export function L5ActionBinder({
  todayActions,
  gateStatus,
  actionPack,
  actionPackPresetId,
  actionPackPresets,
  actionPackExportStatus,
  validationSeverity = 'low',
  blockingIssues = [],
  clarifyQuestions = [],
  clarifyAnswers = {},
  canSubmitClarifications = false,
  clarifyApplyNotice = '',
  isProcessing = false,
  canSyncToManualLoop = false,
  allowExecutionActions = true,
  onChangeActionPackPreset,
  onCreateActionPack,
  onExportActionPack,
  onSyncToManualLoop,
  onSetClarifyAnswer,
  onRemoveClarifyQuestion,
  onApplyClarifications,
  onClearClarifyQuestions,
}) {
  const currentPreset = actionPackPresets.find((preset) => preset.id === actionPackPresetId);
  const hasClarifyQuestions = Array.isArray(clarifyQuestions) && clarifyQuestions.length > 0;
  const visibleBlockingIssues = Array.isArray(blockingIssues) ? blockingIssues : [];

  return (
    <section>
      <h3>실행 준비</h3>
      <p>남은 경고를 확인한 뒤 복사해 쓸 결과를 정리합니다.</p>
      <div className="form-group">
        <label htmlFor="l5-action-pack-preset" className="small-muted">
          출력 형식
        </label>
        <select
          id="l5-action-pack-preset"
          value={actionPackPresetId}
          onChange={(event) => onChangeActionPackPreset(event.target.value)}
        >
          {actionPackPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <p className="small-muted">{toText(currentPreset?.description, '-')}</p>
      </div>
      <PriorityActionList
        items={todayActions}
        maxItems={3}
        emptyItemText="오늘 할 일이 아직 생성되지 않았습니다."
      />
      {allowExecutionActions && canSyncToManualLoop && (
        <div className="form-group">
          <strong>수동 루프</strong>
          <div className="signal-pills">
            <span className="pill">validation: {toText(validationSeverity, 'low')}</span>
            <span className="pill">blocking: {visibleBlockingIssues.length}</span>
            <span className="pill">questions: {clarifyQuestions.length}</span>
          </div>
          <p className="small-muted">
            {hasClarifyQuestions
              ? `수동 루프 질문 ${clarifyQuestions.length}개를 입력 매트릭스에 반영한 뒤, 변환 시작을 직접 실행하세요.`
              : '아직 준비된 수동 루프 질문이 없습니다.'}
          </p>
          {visibleBlockingIssues.length > 0 && (
            <div className="form-group">
              <strong>차단 이슈</strong>
              <ul>
                {visibleBlockingIssues.map((issue, index) => (
                  <li key={`${issue?.id || issue?.message || 'blocking'}-${index}`}>
                    {toText(issue?.message, issue?.id || '-')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasClarifyQuestions && (
            <div className="form-group">
              <strong>보완점 입력</strong>
              {clarifyQuestions.map((question, index) => (
                <div key={`${question}-${index}`} className="form-group">
                  <label>{question}</label>
                  <textarea
                    rows={2}
                    value={typeof clarifyAnswers?.[question] === 'string' ? clarifyAnswers[question] : ''}
                    onChange={(event) => {
                      if (typeof onSetClarifyAnswer === 'function') {
                        onSetClarifyAnswer(question, event.target.value);
                      }
                    }}
                    placeholder="보완할 정보만 바로 입력하세요"
                    disabled={isProcessing}
                  />
                  <div className="stack-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-mini"
                      onClick={() => {
                        if (typeof onRemoveClarifyQuestion === 'function') {
                          onRemoveClarifyQuestion(question);
                        }
                      }}
                      disabled={isProcessing || typeof onRemoveClarifyQuestion !== 'function'}
                    >
                      이 질문 제외
                    </button>
                  </div>
                </div>
              ))}
              <div className="stack-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onApplyClarifications}
                  disabled={isProcessing || typeof onApplyClarifications !== 'function' || !canSubmitClarifications}
                >
                  입력 매트릭스 반영
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClearClarifyQuestions}
                  disabled={isProcessing || typeof onClearClarifyQuestions !== 'function' || !hasClarifyQuestions}
                >
                  이번 질문 비우기
                </button>
              </div>
              {clarifyApplyNotice && <p className="small-muted matrix-notice">{clarifyApplyNotice}</p>}
            </div>
          )}
        </div>
      )}
      <ActionPriorityLegend />
      {allowExecutionActions && (
        <div className="stack-actions">
          {canSyncToManualLoop && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSyncToManualLoop}
              disabled={typeof onSyncToManualLoop !== 'function'}
            >
              질문 동기화
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onCreateActionPack} disabled={gateStatus === 'blocked'}>
            실행용 묶음 만들기
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExportActionPack} disabled={!actionPack}>
            실행용 묶음 복사
          </button>
        </div>
      )}
      {gateStatus === 'blocked' && <p className="small-muted">차단 경고가 남아 있어 복사 및 전달이 비활성화되었습니다.</p>}
      {gateStatus === 'review' && <p className="small-muted">경고가 남아 있어 review 상태입니다. 실행 전 상위 경고를 먼저 처리하는 것을 권장합니다.</p>}
      {actionPackExportStatus && <p className="small-muted">{actionPackExportStatus}</p>}
      {actionPack && (
        <pre className="mono-block">
          {actionPack}
        </pre>
      )}
    </section>
  );
}
