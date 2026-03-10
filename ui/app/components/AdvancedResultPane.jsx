import React from 'react';
import ResultPanel from './ResultPanel';
import ResultPanelBoundary from './ResultPanelBoundary.jsx';
import WorkspaceStatusCard from './WorkspaceStatusCard.jsx';

function buildResultPanelResetKey(resultViewModel) {
  const session = resultViewModel && typeof resultViewModel === 'object' && resultViewModel.session && typeof resultViewModel.session === 'object'
    ? resultViewModel.session
    : {};
  return `${session.status || 'idle'}:${session.activeModel || ''}:${session.vibe || ''}`;
}

export default function AdvancedResultPane({
  statusCard,
  resultViewModel,
}) {
  const status = resultViewModel?.session?.status;

  if (status !== 'success') {
    return <WorkspaceStatusCard {...statusCard} />;
  }

  return (
    <ResultPanelBoundary resetKey={buildResultPanelResetKey(resultViewModel)}>
      <ResultPanel viewModel={resultViewModel} />
    </ResultPanelBoundary>
  );
}
