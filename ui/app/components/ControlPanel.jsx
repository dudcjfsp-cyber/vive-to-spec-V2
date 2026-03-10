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
  showApiSettings = true,
  onOpenSettings,
  onTransmute,
  clarifyApplyNotice = '',
}) {
  const providerLabel = providerOptions.find((provider) => provider.id === apiProvider)?.label || apiProvider;
  const modelLabel = isModelOptionsLoading
    ? '불러오는 중'
    : (selectedModel || modelOptions[0] || '선택 안 됨');

  return (
    <section className="panel control-panel">
      <div className="panel-head">
        <h2>요구 입력</h2>
        <p>요구를 적고 바로 변환을 시작합니다. 프로바이더와 모델은 상단 헤더나 설정에서 바꿉니다.</p>
      </div>

      <div className="signal-pills">
        <span className="pill">프로바이더: {providerLabel}</span>
        <span className="pill">모델: {modelLabel}</span>
      </div>

      <div className="checkbox-row">
        <input
          id="show-thinking"
          type="checkbox"
          checked={showThinking}
          onChange={(event) => onShowThinkingChange(event.target.checked)}
          disabled={status === 'processing'}
        />
        <label htmlFor="show-thinking">사고 정리 레이어 포함</label>
      </div>

      {showApiSettings && (
        <div className="stack-actions form-group">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onOpenSettings}
            disabled={status === 'processing'}
          >
            API / 모델 설정 열기
          </button>
        </div>
      )}

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

      {clarifyApplyNotice && (
        <p className="small-muted matrix-notice">{clarifyApplyNotice}</p>
      )}

      <div className="stack-actions">
        <button type="button" className="btn btn-primary" onClick={onTransmute} disabled={status === 'processing' || !vibe.trim()}>
          {status === 'processing' ? '변환 중...' : '변환 시작'}
        </button>
      </div>
    </section>
  );
}
