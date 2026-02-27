import React from 'react';

export default function ControlPanel({
  vibe,
  status,
  apiProvider,
  providerOptions,
  modelOptions,
  selectedModel,
  isModelOptionsLoading,
  showThinking,
  onVibeChange,
  onProviderChange,
  onModelChange,
  onShowThinkingChange,
  onOpenSettings,
  onTransmute,
}) {
  return (
    <section className="panel control-panel">
      <div className="panel-head">
        <h2>입력 매트릭스</h2>
        <p>프로바이더/모델 설정 후 요구를 입력해 스펙 변환을 시작합니다.</p>
      </div>

      <div className="control-grid">
        <div className="form-group">
          <label htmlFor="provider">프로바이더</label>
          <select
            id="provider"
            value={apiProvider}
            onChange={(event) => onProviderChange(event.target.value)}
            disabled={status === 'processing'}
          >
            {providerOptions.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="model">모델</label>
          <select
            id="model"
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value)}
            disabled={status === 'processing' || isModelOptionsLoading || modelOptions.length === 0}
          >
            {modelOptions.length === 0 && <option value="">모델 없음</option>}
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="checkbox-row">
        <input
          id="show-thinking"
          type="checkbox"
          checked={showThinking}
          onChange={(event) => onShowThinkingChange(event.target.checked)}
          disabled={status === 'processing'}
        />
        <label htmlFor="show-thinking">추론 레이어 포함</label>
      </div>

      <div className="stack-actions form-group">
        <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
          API 키 설정
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="vibe">바이브 / 요구사항</label>
        <textarea
          id="vibe"
          rows={10}
          value={vibe}
          onChange={(event) => onVibeChange(event.target.value)}
          placeholder="아이디어를 자연어로 입력하세요."
          disabled={status === 'processing'}
        />
      </div>

      <div className="stack-actions">
        <button type="button" className="btn btn-primary" onClick={onTransmute} disabled={status === 'processing' || !vibe.trim()}>
          {status === 'processing' ? '변환 중...' : '변환 시작'}
        </button>
      </div>
    </section>
  );
}
