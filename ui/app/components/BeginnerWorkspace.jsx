import React, { useEffect, useMemo, useState } from 'react';
import { ActionPriorityLegend, PriorityActionList } from './PriorityActionList';
import { buildBeginnerQuickPrompt } from './beginner-prompt';
import { buildBeginnerInputNudge } from './beginner-input-nudge.js';
import { buildBeginnerStructureSummary } from './beginner-structure.js';
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

function appendSuggestedLine(vibe, line) {
  const safeVibe = toText(vibe);
  const safeLine = toText(line);
  if (!safeLine) return safeVibe;
  if (!safeVibe) return safeLine;
  if (safeVibe.includes(safeLine)) return safeVibe;
  return `${safeVibe}\n${safeLine}`;
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

  const inputNudge = useMemo(
    () => buildBeginnerInputNudge(vibe),
    [vibe],
  );
  const todayActions = useMemo(
    () => toStringArray(standardOutput?.오늘_할_일_3개),
    [standardOutput],
  );
  const completionScore = useMemo(() => {
    const value = Number(standardOutput?.완성도_진단?.점수_0_100);
    return Number.isFinite(value) ? value : null;
  }, [standardOutput]);
  const structureSummary = useMemo(
    () => buildBeginnerStructureSummary(standardOutput || {}),
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
  const successGuideText = copyStatus === 'success'
    ? '복사 완료. Cursor나 ChatGPT에 바로 붙여넣고 오늘 할 일 1번부터 진행해 보세요.'
    : '실행 프롬프트를 복사한 뒤, 오늘 할 일 1번부터 차례대로 진행해 보세요.';

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
      setCopyMessage('Cursor나 ChatGPT에 바로 붙여넣어 실행해 보세요.');
    } catch {
      setCopyStatus('error');
      setCopyMessage('복사에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleApplyInputNudge = () => {
    const suggestedLine = inputNudge?.suggestedLine;
    if (!suggestedLine) return;
    onVibeChange(appendSuggestedLine(vibe, suggestedLine));
  };

  const handleApplyPrimaryNudge = () => {
    const suggestedLine = structureSummary.primaryNudge?.suggestedLine;
    if (!suggestedLine) return;
    onVibeChange(appendSuggestedLine(vibe, suggestedLine));
  };

  return (
    <section className="panel beginner-workspace">
      <div className="panel-head">
        <h2>입문자 빠른 시작</h2>
        <p>요구사항 한 문장으로 빠르게 첫 초안을 만들고, 바로 실행할 항목부터 확인하세요.</p>
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

      {inputNudge && (
        <section className="beginner-input-nudge">
          <strong>{inputNudge.label}</strong>
          <p className="small-muted">{inputNudge.helper}</p>
          <pre className="mono-block beginner-nudge-line">{inputNudge.suggestedLine}</pre>
          <div className="stack-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleApplyInputNudge}
              disabled={status === 'processing'}
            >
              입력창에 붙이기
            </button>
          </div>
        </section>
      )}

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
          첫 실행에서는 "오늘 할 일 3개 + 바로 복사 프롬프트 + 짧은 보완 힌트"만 먼저 보여줍니다.
        </p>
      )}
      {status === 'processing' && <p>초안을 생성 중입니다. 잠시만 기다려 주세요.</p>}
      {status === 'error' && <p className="beginner-error">오류: {errorMessage || '알 수 없는 오류'}</p>}

      {status === 'success' && (
        <div className="beginner-result-stack">
          <section className="status-bar beginner-success-bar">
            <strong>첫 초안이 준비됐습니다.</strong>
            <span className="pill">할 일 {todayActions.length || 3}개</span>
            <span className="pill">{quickPrompt ? '실행 프롬프트 준비됨' : '프롬프트 재확인 필요'}</span>
            {completionScore !== null && <span className="pill">완성도 {completionScore}</span>}
          </section>
          <p className="small-muted beginner-success-note">{successGuideText}</p>

          <section className="beginner-result-card">
            <div className="panel-head beginner-structure-head">
              <h3>프롬프트 구조 요약</h3>
              <p>아래 실행 프롬프트는 이 4칸을 바탕으로 만들어집니다.</p>
            </div>
            <div className="beginner-structure-grid">
              {structureSummary.slots.map((slot) => (
                <article
                  key={slot.id}
                  className={`beginner-structure-item${slot.isMissing ? ' is-missing' : ''}`}
                >
                  <strong className="beginner-structure-label">{slot.label}</strong>
                  <p className="beginner-structure-value">{slot.value}</p>
                </article>
              ))}
            </div>
            <p className="small-muted beginner-structure-note">{structureSummary.note}</p>
            <p className="beginner-strength-note">{structureSummary.strengthHighlight}</p>
            <p className="small-muted beginner-one-step-note">{structureSummary.oneStepGuide}</p>
            {structureSummary.primaryNudge && (
              <div className="beginner-nudge-box">
                <strong>{structureSummary.primaryNudge.label}</strong>
                <pre className="mono-block beginner-nudge-line">{structureSummary.primaryNudge.suggestedLine}</pre>
                <div className="stack-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleApplyPrimaryNudge}
                    disabled={status === 'processing'}
                  >
                    입력창에 붙이기
                  </button>
                </div>
              </div>
            )}
          </section>

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
            <h3>더 좋아지는 힌트</h3>
            <ul>
              {structureSummary.coachingHints.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
            </ul>
          </section>

          <section className="beginner-result-card">
            <h3>이 구조를 반영한 실행 프롬프트</h3>
            <div className="stack-actions quick-prompt-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCopyPrompt} disabled={!quickPrompt}>
                {copyStatus === 'success' ? '복사 완료' : '실행 프롬프트 복사'}
              </button>
            </div>
            {shouldWarnPromptGaps && (
              <div className="attention-banner urgency-yellow">
                <div className="attention-banner-head">
                  <strong>복사 전에 한 줄만 더 보태면 좋아요</strong>
                </div>
                <p>아래 항목을 함께 적어 주면 결과가 더 안정적으로 맞춰집니다.</p>
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
