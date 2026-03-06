import React from 'react';
import {
  formatHistoryMeta,
  formatLocalTime,
  isObject,
  toText,
} from '../utils';

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
