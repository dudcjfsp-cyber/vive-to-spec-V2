import React, { useMemo, useState } from 'react';
import { ActionPriorityLegend, PriorityActionList } from './PriorityActionList';
import { buildBeginnerQuickPrompt } from './beginner-prompt';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

export default function BeginnerWorkspace({
  vibe,
  status,
  errorMessage,
  standardOutput,
  masterPrompt,
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
  isAdvancedOpen,
  onToggleAdvanced,
}) {
  const [copyStatus, setCopyStatus] = useState('');

  const todayActions = useMemo(
    () => toStringArray(standardOutput?.오늘_할_일_3개),
    [standardOutput],
  );
  const topWarnings = useMemo(
    () => toStringArray(standardOutput?.완성도_진단?.누락_경고).slice(0, 2),
    [standardOutput],
  );

  const quickPromptSource = useMemo(() => {
    const converted = toText(standardOutput?.수정요청_변환?.표준_요청);
    if (converted) return converted;
    return toText(masterPrompt);
  }, [masterPrompt, standardOutput]);
  const quickPromptBundle = useMemo(
    () => buildBeginnerQuickPrompt({
      vibe,
      candidatePrompt: quickPromptSource,
    }),
    [vibe, quickPromptSource],
  );
  const quickPrompt = quickPromptBundle.prompt;
  const quickPromptMeta = quickPromptBundle.meta;

  const handleCopyPrompt = async () => {
    if (!quickPrompt) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus('클립보드를 사용할 수 없어 화면 텍스트를 직접 복사해 주세요.');
      return;
    }
    try {
      await navigator.clipboard.writeText(quickPrompt);
      setCopyStatus('실행 프롬프트를 복사했습니다.');
    } catch {
      setCopyStatus('복사에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <section className="panel beginner-workspace">
      <div className="panel-head">
        <h2>입문자 빠른 시작</h2>
        <p>요구사항 한 문장 입력 후 30초 초안 만들기를 눌러 바로 실행 목록을 받으세요.</p>
      </div>

      <div className="form-group">
        <label htmlFor="beginner-vibe">요청 문장</label>
        <textarea
          id="beginner-vibe"
          rows={8}
          value={vibe}
          onChange={(event) => onVibeChange(event.target.value)}
          placeholder="예: 매장 문의를 자동 응답하고, 운영자는 답변 로그를 확인하고 싶어요."
          disabled={status === 'processing'}
        />
      </div>

      <div className="stack-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onTransmute}
          disabled={status === 'processing' || !vibe.trim()}
        >
          {status === 'processing' ? '초안 생성 중...' : '30초 초안 만들기'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
          API 키 설정
        </button>
        <button type="button" className="btn btn-secondary" onClick={onToggleAdvanced}>
          {isAdvancedOpen ? '고급 보기 닫기' : '고급 보기 열기'}
        </button>
      </div>

      <details className="beginner-settings">
        <summary>모델/설정(선택)</summary>
        <div className="control-grid beginner-settings-grid">
          <div className="form-group">
            <label htmlFor="beginner-provider">프로바이더</label>
            <select
              id="beginner-provider"
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
            <label htmlFor="beginner-model">모델</label>
            <select
              id="beginner-model"
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
            id="beginner-show-thinking"
            type="checkbox"
            checked={showThinking}
            onChange={(event) => onShowThinkingChange(event.target.checked)}
            disabled={status === 'processing'}
          />
          <label htmlFor="beginner-show-thinking">추론 레이어 포함</label>
        </div>
      </details>

      {status === 'idle' && (
        <p className="small-muted">
          첫 실행에서는 “오늘 할 일 3개 + 바로 복사 프롬프트 + 점검 1~2개”만 보여줍니다.
        </p>
      )}
      {status === 'processing' && <p>초안을 생성 중입니다. 잠시만 기다려 주세요.</p>}
      {status === 'error' && <p className="beginner-error">오류: {errorMessage || '알 수 없는 오류'}</p>}

      {status === 'success' && (
        <div className="beginner-result-stack">
          <section className="beginner-result-card">
            <h3>지금 할 일 3개</h3>
            <PriorityActionList
              items={todayActions}
              maxItems={3}
              emptyItemText="할 일 생성 실패: 요청 문장을 조금 더 구체화해 다시 실행해 주세요."
            />
            <ActionPriorityLegend />
          </section>

          <section className="beginner-result-card">
            <h3>바로 실행 프롬프트</h3>
            <div className="prompt-meta-row">
              <span className={`value-chip ${quickPromptMeta.nearParaphrase ? 'warning' : 'pass'}`}>
                원문 유사도 {Math.round(quickPromptMeta.similarity * 100)}%
              </span>
              <span className={`value-chip ${quickPromptMeta.isEnhanced ? 'enhanced' : 'muted'}`}>
                {quickPromptMeta.isEnhanced
                  ? `자동 보강 +${quickPromptMeta.addedItemCount}`
                  : '자동 보강 없음'}
              </span>
            </div>
            <pre className="mono-block">{quickPrompt || '생성된 프롬프트가 없습니다.'}</pre>
            <div className="stack-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCopyPrompt} disabled={!quickPrompt}>
                실행 프롬프트 복사
              </button>
            </div>
            {quickPromptMeta.isEnhanced && (
              <p className="small-muted">
                원문과 유사한 요청이라 입문자 누락 가능성이 큰 항목을 자동 추가했습니다.
              </p>
            )}
            {copyStatus && <p className="small-muted">{copyStatus}</p>}
          </section>

          <section className="beginner-result-card">
            <h3>먼저 확인할 점</h3>
            <ul>
              {(topWarnings.length ? topWarnings : ['현재 차단 경고는 감지되지 않았습니다. 바로 실행해도 됩니다.'])
                .slice(0, 2)
                .map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}
