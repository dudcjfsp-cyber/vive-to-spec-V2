import React from 'react';
import {
  getPriorityByIndex,
  parseBoldSegments,
  PRIORITY_LEVELS,
} from './action-priority.js';

function ActionText({ value }) {
  const segments = parseBoldSegments(value);
  if (segments.length === 0) return <span>-</span>;

  return (
    <span className="priority-action-text">
      {segments.map((segment, idx) => (
        segment.bold
          ? <strong key={`${segment.text}-${idx}`}>{segment.text}</strong>
          : <span key={`${segment.text}-${idx}`}>{segment.text}</span>
      ))}
    </span>
  );
}

export function PriorityActionList({
  items,
  emptyItemText,
  maxItems = 3,
}) {
  const resolvedItems = (Array.isArray(items) && items.length
    ? items
    : [emptyItemText || '표시할 항목이 없습니다.']).slice(0, maxItems);

  return (
    <ol className="priority-action-list">
      {resolvedItems.map((item, idx) => {
        const order = idx + 1;
        const priority = getPriorityByIndex(order);
        return (
          <li key={`${item}-${idx}`} className={`priority-action-item priority-${priority.id}`}>
            <div className="priority-action-head">
              <span className="priority-order">{order}</span>
              <span className={`priority-badge priority-badge-${priority.id}`}>{priority.label}</span>
            </div>
            <ActionText value={item} />
          </li>
        );
      })}
    </ol>
  );
}

export function ActionPriorityLegend() {
  return (
    <section className="priority-legend">
      <strong>우선도 정의표</strong>
      <table className="priority-legend-table">
        <thead>
          <tr>
            <th scope="col">색상</th>
            <th scope="col">우선도</th>
            <th scope="col">의미</th>
          </tr>
        </thead>
        <tbody>
          {PRIORITY_LEVELS.map((priority) => (
            <tr key={priority.id}>
              <td>
                <span className={`priority-badge priority-badge-${priority.id}`}>{priority.colorLabel}</span>
              </td>
              <td>{priority.label}</td>
              <td>{priority.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
