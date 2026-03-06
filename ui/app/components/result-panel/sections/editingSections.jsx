import React from 'react';
import {
  buildL1FocusGuideMessage,
  getUrgencyUiMeta,
  URGENCY_ORDER,
} from '../focus-guide-ui';
import { toText } from '../utils';

function stripLegacyLayerGuideSection(value) {
  const source = toText(value);
  if (!source) return '';

  return source
    .replace(/\n## 참고: L1~L5 레이어[\s\S]*$/u, '')
    .trim();
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

function UrgencyChip({
  urgency,
  text,
  className = '',
}) {
  const meta = getUrgencyUiMeta(urgency);
  const classes = ['urgency-chip', `urgency-${urgency}`, className].filter(Boolean).join(' ');
  return (
    <span
      className={classes}
      aria-label={`${meta.label} 긴급도. ${meta.action}. 패턴 ${meta.pattern}`}
    >
      <span className="urgency-chip-icon" aria-hidden="true">{meta.icon}</span>
      <span>{text || `${meta.label}: ${meta.action}`}</span>
      <span className="urgency-chip-pattern" aria-hidden="true">{meta.pattern}</span>
    </span>
  );
}

export function L1HypothesisEditor({
  hypothesis,
  onChangeHypothesis,
  l1Intelligence,
  l1FocusGuide,
  hypothesisConfirmed,
  hypothesisConfirmedStamp,
  suggestionPreviewOpen = false,
  suggestionStatus = '',
  suggestedHypothesisDiffByField = {},
  showSuggestionInputGuide = false,
  suggestionInputExamples = [],
  onConfirmHypothesis,
  onPreviewSuggestedHypothesis,
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
  const previewFieldIds = fields
    .map((field) => field.id)
    .filter((fieldId) => Boolean(toText(suggestedHypothesisDiffByField[fieldId])));
  const hasPreviewDiff = previewFieldIds.length > 0;

  return (
    <section>
      <h3>요구 확정</h3>
      <p>핵심 요구를 확정하고, 신뢰도 낮은 항목부터 바로 보완합니다.</p>
      <p className="small-muted">
        추론 신뢰도: <strong>{l1Intelligence.overallConfidence}</strong>/100 ({l1Intelligence.confidenceBand})
      </p>

      <div className="urgency-legend" role="list" aria-label="긴급도 범례">
        {URGENCY_ORDER.map((urgency) => (
          <UrgencyChip key={urgency} urgency={urgency} />
        ))}
      </div>

      {l1FocusGuide?.active && (
        <div className={`attention-banner urgency-${l1FocusGuide.urgency}`}>
          <div className="attention-banner-head">
            <strong>핵심 경고 기반 수정 안내</strong>
            <div className="attention-banner-actions">
              <UrgencyChip
                urgency={l1FocusGuide.urgency}
                className="is-compact"
                text={`긴급도 ${getUrgencyUiMeta(l1FocusGuide.urgency).label}`}
              />
              <button type="button" className="btn btn-ghost btn-mini" onClick={onClearL1FocusGuide}>
                표시 해제
              </button>
            </div>
          </div>
          <p>{buildL1FocusGuideMessage(l1FocusGuide)}</p>
          <div className="attention-targets">
            {l1FocusGuide.targetFields.map((fieldId) => (
              <UrgencyChip
                key={fieldId}
                urgency={l1FocusGuide.urgency}
                className="is-compact"
                text={fieldLabelById[fieldId] || fieldId}
              />
            ))}
          </div>
        </div>
      )}

      {suggestionPreviewOpen && (
        <div className="attention-banner urgency-blue">
          <div className="attention-banner-head">
            <strong>추천 가설 미리보기</strong>
          </div>
          <p>{suggestionStatus || '기존 값은 그대로 두고, 변경 예정 값만 먼저 확인합니다.'}</p>
          {!hasPreviewDiff && showSuggestionInputGuide && (
            <div className="form-group">
              <strong>입력 예시</strong>
              <p className="small-muted">아래처럼 5칸(누가/언제/무엇을/왜/성공기준)을 한 번에 적으면 추천 정확도가 올라갑니다.</p>
              <ul className="small-muted">
                {suggestionInputExamples.map((example, index) => (
                  <li key={`l1-suggestion-example-${index}`}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          {hasPreviewDiff && (
            <div className="attention-targets">
              {previewFieldIds.map((fieldId) => (
                <UrgencyChip
                  key={fieldId}
                  urgency="blue"
                  className="is-compact"
                  text={fieldLabelById[fieldId] || fieldId}
                />
              ))}
            </div>
          )}
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
            {suggestionPreviewOpen && toText(suggestedHypothesisDiffByField[field.id]) && (
              <p className="small-muted">
                추천 적용값: {toText(suggestedHypothesisDiffByField[field.id])}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="stack-actions">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={suggestionPreviewOpen && !hasPreviewDiff}
          onClick={suggestionPreviewOpen ? onApplySuggestedHypothesis : onPreviewSuggestedHypothesis}
        >
          {suggestionPreviewOpen
            ? (hasPreviewDiff ? '추천 가설 적용' : '직접 수정 필요')
            : '추천 가설 보기'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirmHypothesis}>
          가설 확정
        </button>
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
      <h3>변경 영향 동기화</h3>
      <p>Text, DB, API, UI 중 한 축을 고치면 나머지 영향 범위를 함께 정리합니다.</p>
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
  const [openTargetId, setOpenTargetId] = React.useState('');
  const secondaryTargets = [
    { id: 'dev', title: '개발자용 (엄격 타입)' },
    { id: 'nondev', title: '비전공자용 (행동/비유)' },
  ];
  const toggleTarget = (targetId) => {
    setOpenTargetId((prev) => (prev === targetId ? '' : targetId));
  };

  return (
    <section>
      <h3>바로 쓰는 결과</h3>
      <p>사람이나 AI에 바로 넘길 수 있는 텍스트를 한곳에 모았습니다.</p>

      <div>
        <strong>AI에 넣을 프롬프트</strong>
        <pre className="mono-block">
          {contextOutputs.aiCoding || '-'}
        </pre>
      </div>

      <div className="stack-actions">
        {secondaryTargets.map((target) => (
          <button
            key={target.id}
            type="button"
            className="btn btn-ghost"
            onClick={() => toggleTarget(target.id)}
          >
            {openTargetId === target.id ? `${target.title} 닫기` : `${target.title} 펼치기`}
          </button>
        ))}
      </div>

      {secondaryTargets.map((target) => (
        openTargetId === target.id ? (
          <div key={target.id}>
            <strong>{target.title}</strong>
            <pre className="mono-block">
              {target.id === 'nondev'
                ? (stripLegacyLayerGuideSection(contextOutputs[target.id]) || '-')
                : (contextOutputs[target.id] || '-')}
            </pre>
          </div>
        ) : null
      ))}

      <button type="button" className="btn btn-primary" onClick={onExportContext}>AI용 프롬프트 복사</button>
      <p className="small-muted">{exportStatus || '아직 복사 전'}</p>
    </section>
  );
}
