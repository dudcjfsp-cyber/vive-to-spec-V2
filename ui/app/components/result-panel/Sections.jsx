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
    <section>
      <h3>{title}</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{value || '-'}</pre>
    </section>
  );
}

export function LayerTabButton({ tab, activeLayer, onSelect }) {
  const isActive = activeLayer === tab.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      style={{
        border: isActive ? '2px solid #0b57d0' : '1px solid #bbb',
        background: isActive ? '#e9f1ff' : '#fff',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      {tab.label}
    </button>
  );
}

export function L1HypothesisEditor({
  hypothesis,
  onChangeHypothesis,
  l1Intelligence,
  hypothesisConfirmed,
  hypothesisConfirmedStamp,
  onConfirmHypothesis,
  onApplySuggestedHypothesis,
}) {
  const fields = [
    { id: 'who', label: '누가' },
    { id: 'when', label: '언제' },
    { id: 'what', label: '무엇을' },
    { id: 'why', label: '왜' },
    { id: 'success', label: '성공기준' },
  ];

  return (
    <section>
      <h3>L1 Intent Extractor</h3>
      <p>AI 가설을 수정/확정 중심으로 다듬고, 신뢰도 낮은 항목부터 질문으로 보완합니다.</p>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        추론 신뢰도: <strong>{l1Intelligence.overallConfidence}</strong>/100 ({l1Intelligence.confidenceBand})
      </p>
      {fields.map((field) => (
        <div key={field.id} style={{ marginBottom: 8 }}>
          <label htmlFor={`l1-${field.id}`} style={{ display: 'block', fontWeight: 600 }}>
            {field.label} ({l1Intelligence.fieldConfidence[field.id] || 0})
          </label>
          <input
            id={`l1-${field.id}`}
            type="text"
            value={hypothesis[field.id]}
            onChange={(event) => onChangeHypothesis(field.id, event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onApplySuggestedHypothesis}>추천 가설 적용</button>
        <button type="button" onClick={onConfirmHypothesis}>가설 확정</button>
      </div>
      {l1Intelligence.questions.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <strong>우선 확인 질문</strong>
          <ol style={{ marginTop: 6 }}>
            {l1Intelligence.questions.map((question, idx) => (
              <li key={`${question}-${idx}`}>{question}</li>
            ))}
          </ol>
        </div>
      )}
      <p style={{ fontSize: 12, marginTop: 8 }}>
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
      <h3>L2 Logic Mapper</h3>
      <p>한 축을 수정하면 다른 축 영향도를 함께 안내하고, 연동 반영으로 동기화합니다.</p>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        합성 점수: <strong>{l2Intelligence.overallScore}</strong>/100
        {' | '}
        정합성: {l2Intelligence.alignmentScore}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {axes.map((axis) => (
          <div key={axis.id}>
            <label htmlFor={`l2-${axis.id}`} style={{ display: 'block', fontWeight: 600 }}>
              {axis.label} ({l2Intelligence.coverageByAxis[axis.id] || 0})
            </label>
            <textarea
              id={`l2-${axis.id}`}
              rows={8}
              value={logicMap[axis.id]}
              onChange={(event) => onChangeLogicAxis(axis.id, event.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>
        {changedAxis
          ? `변경 감지 축: ${changedAxis.toUpperCase()} | 연동 제안: ${syncHint}`
          : '축 변경을 감지하면 연동 제안을 표시합니다.'}
      </p>
      {l2Intelligence.syncSuggestions.length > 0 && (
        <ul style={{ marginTop: 6 }}>
          {l2Intelligence.syncSuggestions.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onApplySync}>연동 반영</button>
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
      <h3>L3 Context Optimizer</h3>
      <p>동일 의미를 수신자별 포맷으로 인코딩해 내보냅니다.</p>
      {targets.map((target) => (
        <div key={target.id} style={{ marginBottom: 12 }}>
          <strong>{target.title}</strong>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, border: '1px solid #e5e5e5' }}>
            {contextOutputs[target.id] || '-'}
          </pre>
        </div>
      ))}
      <button type="button" onClick={onExportContext}>대상별 내보내기</button>
      <p style={{ fontSize: 12, marginTop: 8 }}>{exportStatus || '아직 내보내기 전'}</p>
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
      <h3>L4 Integrity Simulator</h3>
      <p>
        상태: <strong>{gateMeta.label}</strong> | 우선 경고 {topWarnings.length}개 노출 (점수 상위)
      </p>
      <p style={{ fontSize: 12 }}>{gateMeta.message}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Data-Flow: {integritySignals.dataFlow}
        </span>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Permission: {integritySignals.permission}
        </span>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Coherence: {integritySignals.coherence}
        </span>
      </div>
      {topWarnings.length === 0 && <p>충돌 없음. L5로 진행 가능합니다.</p>}
      {topWarnings.map((warning) => (
        <article key={warning.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <strong>{warning.title}</strong>
          <p style={{ fontSize: 12, margin: '6px 0' }}>
            {warning.severity.toUpperCase()} | {WARNING_DOMAIN_LABEL[warning.domain] || warning.domain} | score {warning.score}
          </p>
          <p style={{ margin: '6px 0' }}>{warning.detail}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {warning.actions.map((action) => (
              <button
                key={`${warning.id}-${action.id}`}
                type="button"
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
      <button type="button" onClick={onApplyAutoFixes} disabled={topWarnings.length === 0}>
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
      <h3>L5 Action Binder</h3>
      <p>L4 게이트 상태를 통과해야 실행 팩을 생성할 수 있습니다.</p>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="l5-action-pack-preset" style={{ display: 'block', fontWeight: 600 }}>
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
        <p style={{ fontSize: 12, marginBottom: 0 }}>{toText(currentPreset?.description, '-')}</p>
      </div>
      <ul>
        {todayActions.length
          ? todayActions.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
          : <li>오늘 할 일이 아직 생성되지 않았습니다.</li>}
      </ul>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onCreateActionPack} disabled={gateStatus === 'blocked'}>
          실행 팩 생성
        </button>
        <button type="button" onClick={onExportActionPack} disabled={!actionPack}>
          실행 팩 복사
        </button>
      </div>
      {gateStatus === 'blocked' && <p style={{ fontSize: 12 }}>L4 상태가 blocked라서 실행 CTA가 비활성화되었습니다.</p>}
      {gateStatus === 'review' && <p style={{ fontSize: 12 }}>경고가 남아 있어 review 상태입니다. 실행 전 상위 경고를 먼저 처리하는 것을 권장합니다.</p>}
      {actionPackExportStatus && <p style={{ fontSize: 12 }}>{actionPackExportStatus}</p>}
      {actionPack && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, border: '1px solid #e5e5e5', marginTop: 10 }}>
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
    <section style={{ marginTop: 12, border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
      <h3>CTA 실행 이력</h3>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        최신 {visibleEntries.length}건 표시. 버튼 한 번으로 해당 액션 이전 상태로 되돌립니다.
      </p>
      {visibleEntries.length === 0 && <p style={{ marginBottom: 0 }}>기록된 CTA 이력이 없습니다.</p>}
      {visibleEntries.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {visibleEntries.map((entry) => (
            <li key={entry.id} style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <strong>{entry.label}</strong>
                  <div style={{ fontSize: 12 }}>
                    {entry.layerId} | {entry.actionId} | {formatLocalTime(entry.ts)}
                  </div>
                  <div style={{ fontSize: 12, color: entry.status === 'failed' ? '#b00020' : '#444' }}>
                    상태: {toText(entry.status, 'done')}
                    {entry.error ? ` | 오류: ${entry.error}` : ''}
                  </div>
                  {formatHistoryMeta(entry.meta) && (
                    <div style={{ fontSize: 12, color: '#444' }}>{formatHistoryMeta(entry.meta)}</div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
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
