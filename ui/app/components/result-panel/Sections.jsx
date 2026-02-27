import React from 'react';
import { GATE_STATUS_META, WARNING_DOMAIN_LABEL } from './constants';
import {
  formatHistoryMeta,
  formatLocalTime,
  isObject,
  toText,
} from './utils';

export function TextBlock({ title, value }) {
  return (
    <section className="text-block">
      <h3>{title}</h3>
      <pre className="mono-block">{value || '-'}</pre>
    </section>
  );
}

export function LayerTabButton({ tab, activeLayer, onSelect }) {
  const isActive = activeLayer === tab.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      className={`tab-btn ${isActive ? 'is-active' : ''}`}
    >
      {tab.label}
    </button>
  );
}

export function L1HypothesisEditor({
  hypothesis,
  onChangeHypothesis,
  l1Intelligence,
  l1FocusGuide,
  hypothesisConfirmed,
  hypothesisConfirmedStamp,
  onConfirmHypothesis,
  onApplySuggestedHypothesis,
  onClearL1FocusGuide,
}) {
  const fields = [
    { id: 'who', label: '누가' },
    { id: 'when', label: '언제' },
    { id: 'what', label: '무엇을' },
    { id: 'why', label: '왜' },
    { id: 'success', label: '성공기준' },
  ];
  const fieldLabelById = fields.reduce((acc, field) => {
    acc[field.id] = field.label;
    return acc;
  }, {});

  return (
    <section>
      <h3>L1 의도 추출기</h3>
      <p>AI 가설을 수정/확정 중심으로 다듬고, 신뢰도 낮은 항목부터 질문으로 보완합니다.</p>
      <p className="small-muted">
        추론 신뢰도: <strong>{l1Intelligence.overallConfidence}</strong>/100 ({l1Intelligence.confidenceBand})
      </p>

      <div className="urgency-legend">
        <span className="urgency-chip urgency-red">빨강: 즉시 수정 필요</span>
        <span className="urgency-chip urgency-orange">주황: 우선 수정 권장</span>
        <span className="urgency-chip urgency-yellow">노랑: 검토 필요</span>
      </div>

      {l1FocusGuide?.active && (
        <div className={`attention-banner urgency-${l1FocusGuide.urgency}`}>
          <div className="attention-banner-head">
            <strong>L4 이동 수정 안내</strong>
            <button type="button" className="btn btn-ghost btn-mini" onClick={onClearL1FocusGuide}>
              표시 해제
            </button>
          </div>
          <p>{l1FocusGuide.message}</p>
          <div className="attention-targets">
            {l1FocusGuide.targetFields.map((fieldId) => (
              <span key={fieldId} className={`urgency-chip urgency-${l1FocusGuide.urgency}`}>
                {fieldLabelById[fieldId] || fieldId}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="field-grid">
      {fields.map((field) => (
        <div
          key={field.id}
          className={l1FocusGuide?.active && l1FocusGuide.targetFields.includes(field.id)
            ? `field-attention field-attention-${l1FocusGuide.urgency}`
            : ''}
        >
          <label
            htmlFor={`l1-${field.id}`}
            className={`small-muted ${l1FocusGuide?.active && l1FocusGuide.targetFields.includes(field.id) ? 'field-attention-label' : ''}`}
          >
            {field.label} ({l1Intelligence.fieldConfidence[field.id] || 0})
          </label>
          <input
            id={`l1-${field.id}`}
            type="text"
            value={hypothesis[field.id]}
            onChange={(event) => onChangeHypothesis(field.id, event.target.value)}
          />
        </div>
      ))}
      </div>
      <div className="stack-actions">
        <button type="button" className="btn btn-secondary" onClick={onApplySuggestedHypothesis}>추천 가설 적용</button>
        <button type="button" className="btn btn-primary" onClick={onConfirmHypothesis}>가설 확정</button>
      </div>
      {l1Intelligence.questions.length > 0 && (
        <div>
          <strong>우선 확인 질문</strong>
          <ol>
            {l1Intelligence.questions.map((question, idx) => (
              <li key={`${question}-${idx}`}>{question}</li>
            ))}
          </ol>
        </div>
      )}
      <p className="small-muted">
        상태: {hypothesisConfirmed ? `확정됨 (${hypothesisConfirmedStamp})` : '미확정'}
      </p>
    </section>
  );
}

export function L2LogicMapper({
  logicMap,
  changedAxis,
  syncHint,
  l2Intelligence,
  onChangeLogicAxis,
  onApplySync,
}) {
  const axes = [
    { id: 'text', label: 'Text' },
    { id: 'db', label: 'DB' },
    { id: 'api', label: 'API' },
    { id: 'ui', label: 'UI' },
  ];

  return (
    <section>
      <h3>L2 로직 매퍼</h3>
      <p>한 축을 수정하면 다른 축 영향도를 함께 안내하고, 연동 반영으로 동기화합니다.</p>
      <p className="small-muted">
        합성 점수: <strong>{l2Intelligence.overallScore}</strong>/100
        {' | '}
        정합성: {l2Intelligence.alignmentScore}
      </p>
      <div className="axis-grid">
        {axes.map((axis) => (
          <div key={axis.id}>
            <label htmlFor={`l2-${axis.id}`} className="small-muted">
              {axis.label} ({l2Intelligence.coverageByAxis[axis.id] || 0})
            </label>
            <textarea
              id={`l2-${axis.id}`}
              rows={8}
              value={logicMap[axis.id]}
              onChange={(event) => onChangeLogicAxis(axis.id, event.target.value)}
            />
          </div>
        ))}
      </div>
      <p className="small-muted">
        {changedAxis
          ? `변경 감지 축: ${changedAxis.toUpperCase()} | 연동 제안: ${syncHint}`
          : '축 변경을 감지하면 연동 제안을 표시합니다.'}
      </p>
      {l2Intelligence.syncSuggestions.length > 0 && (
        <ul>
          {l2Intelligence.syncSuggestions.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-primary" onClick={onApplySync}>연동 반영</button>
    </section>
  );
}

export function L3ContextOptimizer({
  contextOutputs,
  exportStatus,
  onExportContext,
}) {
  const targets = [
    { id: 'dev', title: '개발자용 (엄격 타입)' },
    { id: 'nondev', title: '비전공자용 (행동/비유)' },
    { id: 'aiCoding', title: 'AI 코딩용 (실행 프롬프트)' },
  ];

  return (
    <section>
      <h3>L3 컨텍스트 최적화</h3>
      <p>동일 의미를 수신자별 포맷으로 인코딩해 내보냅니다.</p>
      {targets.map((target) => (
        <div key={target.id}>
          <strong>{target.title}</strong>
          <pre className="mono-block">
            {contextOutputs[target.id] || '-'}
          </pre>
        </div>
      ))}
      <button type="button" className="btn btn-primary" onClick={onExportContext}>대상별 내보내기</button>
      <p className="small-muted">{exportStatus || '아직 내보내기 전'}</p>
    </section>
  );
}

export function L4IntegritySimulator({
  gateStatus,
  integritySignals,
  topWarnings,
  remainingWarnings,
  onWarningAction,
  onApplyAutoFixes,
}) {
  const gateMeta = GATE_STATUS_META[gateStatus] || GATE_STATUS_META.pass;

  return (
    <section>
      <h3>L4 무결성 시뮬레이터</h3>
      <p>
        상태: <strong>{gateMeta.label}</strong> | 우선 경고 {topWarnings.length}개 노출 (점수 상위)
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
      {topWarnings.length === 0 && <p>충돌 없음. L5로 진행 가능합니다.</p>}
      {topWarnings.map((warning) => (
        <article key={warning.id} className="warning-card">
          <strong className="warning-title">{warning.title}</strong>
          <p className="warning-meta">
            {warning.severity.toUpperCase()} | {WARNING_DOMAIN_LABEL[warning.domain] || warning.domain} | score {warning.score}
          </p>
          <p>{warning.detail}</p>
          <div className="stack-actions">
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
        </article>
      ))}
      {remainingWarnings.length > 0 && (
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
      <button type="button" className="btn btn-primary" onClick={onApplyAutoFixes} disabled={topWarnings.length === 0}>
        자동 보정 제안 적용
      </button>
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
  onChangeActionPackPreset,
  onCreateActionPack,
  onExportActionPack,
}) {
  const currentPreset = actionPackPresets.find((preset) => preset.id === actionPackPresetId);

  return (
    <section>
      <h3>L5 실행 바인더</h3>
      <p>L4 게이트 상태를 통과해야 실행 팩을 생성할 수 있습니다.</p>
      <div className="form-group">
        <label htmlFor="l5-action-pack-preset" className="small-muted">
          내보내기 프리셋
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
      <ul>
        {todayActions.length
          ? todayActions.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
          : <li>오늘 할 일이 아직 생성되지 않았습니다.</li>}
      </ul>
      <div className="stack-actions">
        <button type="button" className="btn btn-primary" onClick={onCreateActionPack} disabled={gateStatus === 'blocked'}>
          실행 팩 생성
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExportActionPack} disabled={!actionPack}>
          실행 팩 복사
        </button>
      </div>
      {gateStatus === 'blocked' && <p className="small-muted">L4 상태가 blocked라서 실행 CTA가 비활성화되었습니다.</p>}
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

export function CtaHistoryPanel({
  entries,
  onRollback,
}) {
  const visibleEntries = entries.slice(0, 12);

  return (
    <section className="panel history-panel">
      <h3>CTA 실행 이력</h3>
      <p className="small-muted">
        최신 {visibleEntries.length}건 표시. 버튼 한 번으로 해당 액션 이전 상태로 되돌립니다.
      </p>
      {visibleEntries.length === 0 && <p>기록된 CTA 이력이 없습니다.</p>}
      {visibleEntries.length > 0 && (
        <ul className="history-list">
          {visibleEntries.map((entry) => (
            <li key={entry.id} className="history-item">
              <div className="history-row">
                <div>
                  <strong>{entry.label}</strong>
                  <div className="history-meta">
                    {entry.layerId} | {entry.actionId} | {formatLocalTime(entry.ts)}
                  </div>
                  <div className={`history-meta history-status ${entry.status === 'failed' ? 'error' : ''}`}>
                    상태: {toText(entry.status, 'done')}
                    {entry.error ? ` | 오류: ${entry.error}` : ''}
                  </div>
                  {formatHistoryMeta(entry.meta) && (
                    <div className="history-meta">{formatHistoryMeta(entry.meta)}</div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => onRollback(entry.id)}
                    disabled={!isObject(entry.snapshotBefore)}
                  >
                    이 시점으로 되돌리기
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
