import { useCallback, useState } from 'react';
import { buildActionPack } from '../builders.js';
import { ACTION_PACK_PRESETS } from '../constants.js';
import { isObject, toText } from '../utils.js';

const DEFAULT_ACTION_PACK_PRESET_ID = ACTION_PACK_PRESETS[0]?.id || 'cursor';

export function useActionPackState() {
  const [actionPack, setActionPack] = useState('');
  const [actionPackPresetId, setActionPackPresetId] = useState(DEFAULT_ACTION_PACK_PRESET_ID);
  const [actionPackExportStatus, setActionPackExportStatus] = useState('');

  const buildActionPackSnapshot = useCallback(() => ({
    actionPack,
    actionPackPresetId,
    actionPackExportStatus,
  }), [actionPack, actionPackExportStatus, actionPackPresetId]);

  const restoreActionPackSnapshot = useCallback((snapshot) => {
    const safe = isObject(snapshot) ? snapshot : {};
    setActionPack(toText(safe.actionPack));
    setActionPackPresetId(toText(safe.actionPackPresetId, DEFAULT_ACTION_PACK_PRESET_ID));
    setActionPackExportStatus(toText(safe.actionPackExportStatus));
  }, []);

  const resetActionPackState = useCallback(() => {
    setActionPack('');
    setActionPackPresetId(DEFAULT_ACTION_PACK_PRESET_ID);
    setActionPackExportStatus('');
  }, []);

  const changeActionPackPreset = useCallback((nextPresetId) => {
    setActionPackPresetId(toText(nextPresetId, DEFAULT_ACTION_PACK_PRESET_ID));
    setActionPackExportStatus('');
  }, []);

  const buildAndStoreActionPack = useCallback(({
    contextOutputs,
    todayActions,
    activeModel,
    gateStatus,
  }) => {
    const pack = buildActionPack({
      contextOutputs,
      todayActions,
      activeModel,
      gateStatus,
      presetId: actionPackPresetId,
    });
    setActionPack(pack);
    setActionPackExportStatus(`${actionPackPresetId.toUpperCase()} 프리셋 실행 팩을 생성했습니다.`);
    return pack;
  }, [actionPackPresetId]);

  const exportCurrentActionPack = useCallback(async () => {
    if (!actionPack) {
      setActionPackExportStatus('먼저 실행 팩을 생성해 주세요.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setActionPackExportStatus('클립보드 미지원 환경입니다. 실행 팩 본문을 직접 복사하세요.');
      return;
    }

    try {
      await navigator.clipboard.writeText(actionPack);
      setActionPackExportStatus(`${actionPackPresetId.toUpperCase()} 실행 팩을 클립보드에 복사했습니다.`);
    } catch {
      setActionPackExportStatus('클립보드 복사에 실패했습니다. 실행 팩 본문을 직접 복사하세요.');
    }
  }, [actionPack, actionPackPresetId]);

  return {
    actionPack,
    actionPackPresetId,
    actionPackPresets: ACTION_PACK_PRESETS,
    actionPackExportStatus,
    buildActionPackSnapshot,
    restoreActionPackSnapshot,
    resetActionPackState,
    changeActionPackPreset,
    buildAndStoreActionPack,
    exportCurrentActionPack,
  };
}
