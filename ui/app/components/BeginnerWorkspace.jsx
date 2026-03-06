import React, { useEffect, useMemo, useState } from 'react';
import { ActionPriorityLegend, PriorityActionList } from './PriorityActionList';
import { buildBeginnerQuickPrompt } from './beginner-prompt';
import {
  buildContextOutputs,
  buildLogicMap,
  buildProblemFrame,
} from './result-panel/builders.js';

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
  showApiSettings = true,
  onVibeChange,
  onOpenSettings,
  onTransmute,
}) {
  const [copyStatus, setCopyStatus] = useState('idle');
  const [copyMessage, setCopyMessage] = useState('');

  const todayActions = useMemo(
    () => toStringArray(standardOutput?.오늘_할_일_3개),
    [standardOutput],
  );
  const topWarnings = useMemo(
    () => toStringArray(standardOutput?.완성도_진단?.누락_경고).slice(0, 2),
    [standardOutput],
  );

  const quickPromptSource = useMemo(() => {
    const hypothesis = buildProblemFrame(standardOutput || {});
    const logicMap = buildLogicMap(standardOutput || {}, hypothesis);
    const contextOutputs = buildContextOutputs({
      devSpec: '',
      nondevSpec: '',
      masterPrompt,
      hypothesis,
      logicMap,
    });
    return toText(contextOutputs.aiCoding);
  }, [masterPrompt, standardOutput]);
  const quickPromptBundle = useMemo(
    () => buildBeginnerQuickPrompt({
      vibe,
      candidatePrompt: quickPromptSource,
    }),
    [vibe, quickPromptSource],
  );
  const quickPrompt = quickPromptSource;
  const quickPromptMeta = quickPromptBundle.meta;
  const quickPromptGaps = Array.isArray(quickPromptMeta.addedRequirements)
    ? quickPromptMeta.addedRequirements
    : [];
  const shouldWarnPromptGaps = quickPromptMeta.isEnhanced && quickPromptGaps.length > 0;

  useEffect(() => {
    setCopyStatus('idle');
    setCopyMessage('');
  }, [quickPrompt]);

  const handleCopyPrompt = async () => {
    if (!quickPrompt) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus('error');
      setCopyMessage('클립보드를 사용할 수 없어 화면 텍스트를 직접 복사해 주세요.');
      return;
    }
    try {
      await navigator.clipboard.writeText(quickPrompt);
      setCopyStatus('success');
      setCopyMessage('');
    } catch {
      setCopyStatus('error');
      setCopyMessage('복사에 실패했습니다. 다시 시도해 주세요.');
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
        {showApiSettings && (
          <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
            API 키 설정
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="small-muted">
          첫 실행에서는 "오늘 할 일 3개 + 바로 복사 프롬프트 + 점검 1~2개"만 보여줍니다.
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
            <h3>먼저 확인할 점</h3>
            <ul>
              {(topWarnings.length ? topWarnings : ['현재 차단 경고는 감지되지 않았습니다. 바로 실행해도 됩니다.'])
                .slice(0, 2)
                .map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
            </ul>
          </section>

          <section className="beginner-result-card">
            <h3>바로 실행 프롬프트</h3>
            <div className="stack-actions quick-prompt-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCopyPrompt} disabled={!quickPrompt}>
                {copyStatus === 'success' ? '복사 완료' : '실행 프롬프트 복사'}
              </button>
            </div>
            {shouldWarnPromptGaps && (
              <div className="attention-banner urgency-yellow">
                <div className="attention-banner-head">
                  <strong>보완할 점이 있습니다</strong>
                </div>
                <p>이 프롬프트를 그대로 입력하면 의도와 다른 형태로 결과가 만들어질 가능성이 있습니다.</p>
                <ul>
                  {quickPromptGaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <pre className="mono-block">{quickPrompt || '생성된 프롬프트가 없습니다.'}</pre>
            {copyMessage && <p className="small-muted">{copyMessage}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
