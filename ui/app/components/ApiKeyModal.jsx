import React from 'react';

export default function ApiKeyModal({
  isOpen,
  providerLabel,
  providerOptions = [],
  selectedProvider = '',
  onProviderChange,
  modelOptions = [],
  selectedModel = '',
  isModelOptionsLoading = false,
  onModelChange,
  showApiKeyInput = true,
  tempKey,
  onTempKeyChange,
  onSave,
  onClose,
}) {
  if (!isOpen) return null;

  const modelPlaceholder = isModelOptionsLoading
    ? '모델 목록 불러오는 중'
    : (modelOptions.length === 0 ? '선택 가능한 모델 없음' : '모델 선택');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal-card" onClick={(event) => event.stopPropagation()}>
        <h3>API / 모델 설정</h3>
        <p className="small-muted">현재 provider: {providerLabel}. 세션 중 언제든지 provider와 모델을 바꿀 수 있습니다.</p>

        {providerOptions.length > 0 && (
          <div className="form-group api-key-provider-group">
            <label htmlFor="api-key-provider">프로바이더</label>
            <select
              id="api-key-provider"
              value={selectedProvider}
              onChange={(event) => onProviderChange?.(event.target.value)}
            >
              {providerOptions.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group api-key-model-group">
          <label htmlFor="api-key-model">모델</label>
          <select
            id="api-key-model"
            value={selectedModel}
            onChange={(event) => onModelChange?.(event.target.value)}
            disabled={isModelOptionsLoading || modelOptions.length === 0}
          >
            {(modelOptions.length === 0 || isModelOptionsLoading) && (
              <option value="">{modelPlaceholder}</option>
            )}
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <p className="small-muted api-key-model-help">
            실제 목록을 불러오고, 실패하면 provider별 기본 추천 모델로 fallback됩니다.
          </p>
        </div>

        {showApiKeyInput && (
          <>
            <input
              type="password"
              value={tempKey}
              onChange={(event) => onTempKeyChange(event.target.value)}
              placeholder="API 키를 붙여넣으세요"
            />
            <p className="small-muted">API 키는 선택한 provider 기준으로 세션에만 저장되며 30분 후 자동 만료됩니다.</p>
          </>
        )}

        <div className="stack-actions form-group api-key-modal-actions">
          <button type="button" className="btn btn-primary" onClick={onSave}>저장</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
        <p className="modal-footnote">
          설정값은 브라우저 세션 기준으로 유지되며, 생성 시 현재 선택한 provider/model이 사용됩니다.
        </p>
      </section>
    </div>
  );
}
