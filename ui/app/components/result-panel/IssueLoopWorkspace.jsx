import React, { useMemo } from 'react';
import { WARNING_DOMAIN_LABEL } from './constants';
import { toText } from './utils';

const ISSUE_STATUS_LABEL = {
  queued: '대기',
  in_progress: '작업중',
  recheck_needed: '재검사 필요',
  resolved: '해결',
};

const ISSUE_STATUS_CLASS = {
  queued: 'muted',
  in_progress: 'warning',
  recheck_needed: 'warning',
  resolved: 'pass',
};

function IssueStatusChip({ status }) {
  const safeStatus = toText(status, 'queued');
  return (
    <span className={`value-chip ${ISSUE_STATUS_CLASS[safeStatus] || 'muted'}`}>
      {ISSUE_STATUS_LABEL[safeStatus] || ISSUE_STATUS_LABEL.queued}
    </span>
  );
}

export default function IssueLoopWorkspace({
  gateStatus,
  warningSummary,
  unresolvedWarnings,
  selectedIssueId,
  issueStatusById,
  issueLoopMessage,
  onSelectIssue,
  onRunIssueAction,
  onRecheckNow,
  todayActions,
  actionPack,
  actionPackExportStatus,
  onCreateActionPack,
  onExportActionPack,
}) {
  const activeIssue = useMemo(
    () => unresolvedWarnings.find((warning) => warning.id === selectedIssueId) || null,
    [selectedIssueId, unresolvedWarnings],
  );
  const canExport = gateStatus !== 'blocked';
  const topActions = Array.isArray(todayActions) ? todayActions.slice(0, 3) : [];

  return (
    <section className="panel issue-loop-workspace">
      <div className="panel-head">
        <h2>이슈 루프 워크스페이스</h2>
        <p>해결할 이슈를 선택하고 수정한 뒤 `지금 재검사`로 바로 검증합니다.</p>
      </div>

      <div className="issue-loop-grid">
        <section className="issue-panel">
          <h3>요약</h3>
          <div className="signal-pills">
            <span className={`pill ${gateStatus === 'pass' ? '' : 'warning'}`}>게이트: {gateStatus}</span>
            <span className="pill">강한 차단: {Number(warningSummary?.hardBlockCount || 0)}</span>
            <span className="pill">총 경고: {Number(warningSummary?.total || unresolvedWarnings.length || 0)}</span>
          </div>
          {topActions.length > 0 && (
            <ul className="issue-summary-list">
              {topActions.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
            </ul>
          )}
          {issueLoopMessage && <p className="small-muted">{issueLoopMessage}</p>}
          <div className="stack-actions">
            <button type="button" className="btn btn-secondary" onClick={onRecheckNow}>
              지금 재검사
            </button>
          </div>
        </section>

        <section className="issue-panel">
          <h3>해결할 이슈</h3>
          {unresolvedWarnings.length === 0 && <p className="small-muted">현재 미해결 이슈가 없습니다.</p>}
          <div className="issue-list">
            {unresolvedWarnings.map((issue) => {
              const isActive = issue.id === selectedIssueId;
              const status = toText(issueStatusById?.[issue.id], 'queued');
              const domainLabel = WARNING_DOMAIN_LABEL[toText(issue.domain)] || toText(issue.domain, '-');
              return (
                <button
                  key={issue.id}
                  type="button"
                  className={`issue-card${isActive ? ' is-active' : ''}`}
                  onClick={() => onSelectIssue(issue.id)}
                >
                  <div className="issue-card-head">
                    <strong>{issue.title}</strong>
                    <IssueStatusChip status={status} />
                  </div>
                  <p className="small-muted">
                    {issue.severity?.toUpperCase()} | {domainLabel} | score {Number(issue.score || 0)}
                  </p>
                  <p>{issue.detail}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="issue-panel">
        <h3>선택 이슈 액션</h3>
        {!activeIssue && <p className="small-muted">이슈를 선택하면 가능한 액션이 표시됩니다.</p>}
        {activeIssue && (
          <>
            <div className="issue-card-head">
              <strong>{activeIssue.title}</strong>
              <IssueStatusChip status={toText(issueStatusById?.[activeIssue.id], 'queued')} />
            </div>
            <div className="stack-actions">
              {activeIssue.actions.map((action) => (
                <button
                  key={`${activeIssue.id}-${action.id}`}
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onRunIssueAction(activeIssue.id, action.id)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="issue-panel">
        <h3>내보내기</h3>
        <div className="stack-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreateActionPack}
            disabled={!canExport}
          >
            실행 팩 생성
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportActionPack}
            disabled={!actionPack}
          >
            실행 팩 복사
          </button>
        </div>
        {!canExport && <p className="small-muted">게이트가 blocked 상태라 내보내기가 비활성화되었습니다.</p>}
        {actionPackExportStatus && <p className="small-muted">{actionPackExportStatus}</p>}
      </section>
    </section>
  );
}
