import React from 'react';

function TextBlock({ title, value }) {
  return (
    <section>
      <h3>{title}</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{value || '-'}</pre>
    </section>
  );
}

export default function ResultPanel({
  status,
  errorMessage,
  activeModel,
  hybridStackGuideStatus,
  nondevSpec,
  devSpec,
  masterPrompt,
  onRefreshHybrid,
}) {
  if (status === 'idle') {
    return <p>Submit a requirement to generate specs.</p>;
  }

  if (status === 'processing') {
    return <p>Generating spec...</p>;
  }

  if (status === 'error') {
    return <p>Error: {errorMessage || 'Unknown error'}</p>;
  }

  return (
    <section>
      <div>
        <strong>Model:</strong> {activeModel} | <strong>Hybrid stack:</strong> {hybridStackGuideStatus}
        <button type="button" onClick={onRefreshHybrid} style={{ marginLeft: 8 }}>
          Refresh Hybrid Guide
        </button>
      </div>

      <TextBlock title="Non-dev Spec" value={nondevSpec} />
      <TextBlock title="Dev Spec" value={devSpec} />
      <TextBlock title="Master Prompt" value={masterPrompt} />
    </section>
  );
}

