import React from 'react';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toFrameList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === 'object' ? item : null))
    .filter(Boolean);
}

function toStackList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === 'object' ? item : null))
    .filter(Boolean);
}

function normalizeConfidence(value) {
  const normalized = toText(value, 'low').toLowerCase();
  if (normalized === 'high' || normalized === 'medium') return normalized;
  return 'low';
}

function confidenceLabel(value) {
  const normalized = normalizeConfidence(value);
  if (normalized === 'high') return '적합도 높음';
  if (normalized === 'medium') return '적합도 중간';
  return '적합도 낮음';
}

export default function HybridStackGuidePanel({
  guide,
  status = 'idle',
  compact = false,
  title = '하이브리드 스택 가이드',
}) {
  const frames = toFrameList(guide?.frames);
  const guideModel = toText(guide?.model);

  return (
    <section className={`hybrid-guide-panel ${compact ? 'is-compact' : ''}`}>
      <div className="hybrid-guide-head">
        <h3>{title}</h3>
        {guideModel && <span className="small-muted">생성 모델: {guideModel}</span>}
      </div>

      {status === 'idle' && (
        <p className="small-muted">아직 하이브리드 스택 가이드가 생성되지 않았습니다.</p>
      )}

      {status === 'loading' && (
        <p className="small-muted">요구와 스펙을 기준으로 추천 스택 프레임을 계산하는 중입니다.</p>
      )}

      {status === 'error' && (
        <p className="small-muted">하이브리드 스택 가이드를 가져오지 못했습니다. 새로고침으로 다시 시도할 수 있습니다.</p>
      )}

      {status === 'success' && frames.length === 0 && (
        <p className="small-muted">추천 가능한 스택 프레임이 아직 비어 있습니다.</p>
      )}

      {status === 'success' && frames.length > 0 && (
        <div className="hybrid-frame-grid">
          {frames.map((frame) => {
            const stacks = toStackList(frame.stacks).slice(0, compact ? 2 : 3);
            return (
              <article key={toText(frame.id, frame.label)} className="hybrid-frame-card">
                <div className="hybrid-frame-title-row">
                  <strong>{toText(frame.label, '옵션')}</strong>
                  <span className="small-muted">{toText(frame.id)}</span>
                </div>
                <p className="small-muted hybrid-frame-strategy">
                  {toText(frame.strategy, '추천 전략 정보 없음')}
                </p>
                {stacks.length === 0 && (
                  <p className="small-muted">추천 스택이 비어 있습니다.</p>
                )}
                {stacks.length > 0 && (
                  <ul className="hybrid-stack-list">
                    {stacks.map((stack) => {
                      const confidence = normalizeConfidence(stack.confidence);
                      return (
                        <li key={`${toText(frame.id)}-${toText(stack.name)}`} className="hybrid-stack-item">
                          <div className="hybrid-stack-head">
                            <strong>{toText(stack.name, 'stack')}</strong>
                            <span className={`confidence-chip confidence-${confidence}`}>
                              {confidenceLabel(confidence)}
                            </span>
                          </div>
                          <p>{toText(stack.why, '추천 이유 정보 없음')}</p>
                          {toText(stack.fit) && (
                            <p className="small-muted">
                              맞는 상황: {toText(stack.fit)}
                            </p>
                          )}
                          {!compact && toText(stack.risk) && (
                            <p className="small-muted">
                              주의점: {toText(stack.risk)}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
