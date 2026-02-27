import { useCallback, useRef, useState } from 'react';
import { CTA_HISTORY_MAX_LENGTH } from '../constants.js';
import {
  deepClone,
  isObject,
  isPromiseLike,
  toErrorMessage,
  toText,
} from '../utils.js';

export function useCtaHistory({
  buildPanelSnapshot,
  restorePanelSnapshot,
  onActionFailure,
  onRollbackApplied,
}) {
  const [ctaHistory, setCtaHistory] = useState([]);
  const historySequenceRef = useRef(0);

  const appendHistoryEntry = useCallback(({ layerId, actionId, label, meta = {}, snapshotBefore }) => {
    historySequenceRef.current += 1;
    const entry = {
      id: `cta-${Date.now()}-${historySequenceRef.current}`,
      ts: Date.now(),
      layerId: toText(layerId, 'SYSTEM'),
      actionId: toText(actionId, 'action'),
      label: toText(label, '액션 실행'),
      status: 'running',
      error: '',
      meta: isObject(meta) ? deepClone(meta) : {},
      snapshotBefore: isObject(snapshotBefore) ? deepClone(snapshotBefore) : null,
    };
    setCtaHistory((prev) => [entry, ...prev].slice(0, CTA_HISTORY_MAX_LENGTH));
    return entry.id;
  }, []);

  const patchHistoryEntry = useCallback((entryId, patch = {}) => {
    if (!toText(entryId)) return;
    setCtaHistory((prev) => prev.map((entry) => (
      entry.id === entryId ? { ...entry, ...patch } : entry
    )));
  }, []);

  const runCtaAction = useCallback(({ layerId, actionId, label, meta = {}, mutate }) => {
    const snapshotBefore = deepClone(buildPanelSnapshot());
    const entryId = appendHistoryEntry({ layerId, actionId, label, meta, snapshotBefore });

    if (typeof mutate !== 'function') {
      patchHistoryEntry(entryId, { status: 'done' });
      return undefined;
    }

    const failAndRestore = (error) => {
      restorePanelSnapshot(snapshotBefore);
      const message = toErrorMessage(error);
      patchHistoryEntry(entryId, { status: 'failed', error: message });
      if (typeof onActionFailure === 'function') {
        onActionFailure(message);
      }
      return undefined;
    };

    try {
      const result = mutate();
      if (isPromiseLike(result)) {
        return result
          .then((resolved) => {
            patchHistoryEntry(entryId, { status: 'done', error: '' });
            return resolved;
          })
          .catch((error) => failAndRestore(error));
      }

      patchHistoryEntry(entryId, { status: 'done', error: '' });
      return result;
    } catch (error) {
      return failAndRestore(error);
    }
  }, [
    appendHistoryEntry,
    buildPanelSnapshot,
    onActionFailure,
    patchHistoryEntry,
    restorePanelSnapshot,
  ]);

  const rollbackToHistory = useCallback((entryId) => {
    const target = ctaHistory.find((entry) => entry.id === entryId);
    if (!target || !isObject(target.snapshotBefore)) return;
    const targetSnapshot = deepClone(target.snapshotBefore);

    if (typeof window !== 'undefined') {
      const message = `[${target.layerId}] ${target.label} 이전 상태로 되돌릴까요?`;
      if (!window.confirm(message)) return;
    }

    runCtaAction({
      layerId: 'SYSTEM',
      actionId: 'rollback',
      label: '이력 롤백 적용',
      meta: {
        targetId: target.id,
        targetLayer: target.layerId,
        targetAction: target.actionId,
      },
      mutate: () => {
        restorePanelSnapshot(targetSnapshot);
        if (typeof onRollbackApplied === 'function') {
          onRollbackApplied(target);
        }
      },
    });
  }, [
    ctaHistory,
    onRollbackApplied,
    restorePanelSnapshot,
    runCtaAction,
  ]);

  const resetCtaHistory = useCallback(() => {
    setCtaHistory([]);
    historySequenceRef.current = 0;
  }, []);

  return {
    ctaHistory,
    runCtaAction,
    rollbackToHistory,
    resetCtaHistory,
  };
}
