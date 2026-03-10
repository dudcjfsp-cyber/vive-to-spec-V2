import React from 'react';

export default function WorkspaceStatusCard({
  title,
  body,
  items = [],
  tone = 'idle',
}) {
  const safeItems = Array.isArray(items) ? items.filter((item) => typeof item === 'string' && item.trim()) : [];

  return (
    <section className={`workspace-status-card is-${tone}`}>
      <strong className="workspace-status-title">{title}</strong>
      <p className="workspace-status-body">{body}</p>
      {safeItems.length > 0 && (
        <ul className="workspace-status-list">
          {safeItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </section>
  );
}
