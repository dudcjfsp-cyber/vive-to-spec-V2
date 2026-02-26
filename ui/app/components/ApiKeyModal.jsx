import React from 'react';

export default function ApiKeyModal({
  isOpen,
  providerLabel,
  tempKey,
  onTempKeyChange,
  onSave,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <section style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
      <h3>{providerLabel} API Key</h3>
      <input
        type="password"
        value={tempKey}
        onChange={(event) => onTempKeyChange(event.target.value)}
        placeholder="Paste API key"
        style={{ width: '100%' }}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={onSave}>Save</button>
        <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
      </div>
      <p style={{ fontSize: 12 }}>
        Key is stored in sessionStorage only and expires in 30 minutes.
      </p>
    </section>
  );
}

