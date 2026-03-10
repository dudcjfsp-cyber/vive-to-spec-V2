import React, { useMemo } from 'react';
import { GATE_STATUS_META, WARNING_DOMAIN_LABEL } from './constants';
import { toText } from './utils';

const ISSUE_STAGES = [
  {
    id: 'block',
    title: '1단계 지금 막힘',
    description: '바로 보완하지 않으면 다음 단계로 넘기기 어려운 이슈입니다.',
    emptyText: '현재 즉시 차단 이슈는 없습니다.',
  },
  {
    id: 'review',
    title: '2단계 실행 전 검토',
    description: '막히지는 않지만 구현 전에 합의하거나 정리할 부분입니다.',
    emptyText: '현재 검토 필요 이슈는 없습니다.',
  },
  {
    id: 'refine',
    title: '3단계 나중에 다듬기',
    description: '실행 이후 품질과 운영 안정성을 높이기 위한 후속 이슈입니다.',
    emptyText: '현재 후속 개선 이슈는 없습니다.',
  },
];

function resolveIssueStageId(warning) {
  const severity = toText(warning?.severity).toLowerCase();
  if (severity === 'critical' || severity === 'high') return 'block';
  if (severity === 'medium') return 'review';
  return 'refine';
}

function getSeverityLabel(severity) {
  const normalized = toText(severity).toLowerCase();
  if (normalized === 'critical') return '매우 높음';
  if (normalized === 'high') return '높음';
  if (normalized === 'medium') return '보통';
  return '낮음';
}

function IssueStageCard({ stage, items }) {
  const visibleItems = items.slice(0, 4);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <article className={`issue-level-card stage-${stage.id}`}>
      <div className="issue-level-card-head">
        <h3>{stage.title}</h3>
        <span className="pill">{items.length}개</span>
      </div>
      <p className="small-muted">{stage.description}</p>
      {visibleItems.length === 0 && <p className="small-muted">{stage.emptyText}</p>}
      {visibleItems.length > 0 && (
        <ul className="issue-level-list">
          {visibleItems.map((item) => {
            const domainLabel = WARNING_DOMAIN_LABEL[toText(item.domain)] || toText(item.domain, '기타');
            return (
              <li key={item.id} className="issue-level-item">
                <strong>{item.title}</strong>
                <p className="small-muted">
                  심각도 {getSeverityLabel(item.severity)} | {domainLabel} | 우선도 {Number(item.score || 0)}
                </p>
                <p>{item.detail}</p>
              </li>
            );
          })}
        </ul>
      )}
      {remainingCount > 0 && <p className="small-muted">외 {remainingCount}개 이슈가 더 있습니다.</p>}
    </article>
  );
}

export default function IssueLoopWorkspace({
  gateStatus,
  warningSummary,
  unresolvedWarnings,
}) {
  const gateLabel = GATE_STATUS_META[gateStatus]?.label || gateStatus;
  const stageGroups = useMemo(
    () => ISSUE_STAGES.map((stage) => ({
      ...stage,
      items: unresolvedWarnings.filter((warning) => resolveIssueStageId(warning) === stage.id),
    })),
    [unresolvedWarnings],
  );

  return (
    <section className="panel issue-level-summary">
      <div className="panel-head">
        <h2>이슈 수준 요약</h2>
        <p>클릭으로 이동하지 않고, 현재 경고를 세 단계 수준으로 나눠 어떤 이슈인지 바로 확인합니다.</p>
      </div>

      <div className="signal-pills">
        <span className={`pill ${gateStatus === 'pass' ? '' : 'warning'}`}>진행 상태: {gateLabel}</span>
        <span className="pill">강한 차단: {Number(warningSummary?.hardBlockCount || 0)}</span>
        <span className="pill">총 경고: {Number(warningSummary?.total || unresolvedWarnings.length || 0)}</span>
      </div>

      <div className="issue-level-grid">
        {stageGroups.map((stage) => (
          <IssueStageCard key={stage.id} stage={stage} items={stage.items} />
        ))}
      </div>
    </section>
  );
}
