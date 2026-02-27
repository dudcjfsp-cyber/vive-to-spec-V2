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
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal-card" onClick={(event) => event.stopPropagation()}>
        <h3>{providerLabel} API 키</h3>
        <p className="small-muted">세션 단위로만 저장되며 30분 후 자동 만료됩니다.</p>
        <input
          type="password"
          value={tempKey}
          onChange={(event) => onTempKeyChange(event.target.value)}
          placeholder="API 키를 붙여넣으세요"
        />
        <div className="stack-actions form-group">
          <button type="button" className="btn btn-primary" onClick={onSave}>저장</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
        <p className="modal-footnote">
          API key는 `sessionStorage`에만 유지되며 브라우저 종료 시 제거됩니다.
        </p>
      </section>
    </div>
  );
}
