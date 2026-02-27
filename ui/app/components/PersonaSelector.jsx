import React from 'react';

export default function PersonaSelector({
  presets,
  onSelectPersona,
}) {
  return (
    <section className="panel persona-selector">
      <div className="panel-head">
        <h2>시작 모드 선택</h2>
        <p>처음에는 본인 수준에 맞는 화면으로 시작하고, 언제든 모드를 바꿀 수 있습니다.</p>
      </div>
      <div className="persona-grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="persona-card"
            onClick={() => onSelectPersona(preset.id)}
          >
            <strong>{preset.label}</strong>
            <span>{preset.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
