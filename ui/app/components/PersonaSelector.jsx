import React from 'react';

export default function PersonaSelector({
  presets,
  onSelectPersona,
  selectedPersonaId = '',
  compact = false,
  disabled = false,
}) {
  return (
    <section className={`panel persona-selector${compact ? ' compact' : ''}`}>
      <div className="panel-head">
        <h2>{compact ? '세션 전환' : '시작 모드 선택'}</h2>
        <p>
          {compact
            ? '현재 작업 상태를 유지한 채 바로 다른 세션으로 전환할 수 있습니다.'
            : '처음에는 본인 수준에 맞는 화면으로 시작하고, 이후에도 바로 바꿀 수 있습니다.'}
        </p>
      </div>
      <div className={`persona-grid${compact ? ' compact' : ''}`}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`persona-card${selectedPersonaId === preset.id ? ' is-active' : ''}${compact ? ' compact' : ''}`}
            onClick={() => onSelectPersona(preset.id)}
            aria-pressed={selectedPersonaId === preset.id}
            disabled={disabled}
          >
            <strong>{preset.label}</strong>
            <span>{preset.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
