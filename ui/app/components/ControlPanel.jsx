import React from 'react';

export default function ControlPanel({
  vibe,
  status,
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
}) {
  return (
    <section>
      <h2>Input</h2>
      <div>
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
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

      <div>
        <label htmlFor="model">Model</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(event) => onModelChange(event.target.value)}
          disabled={status === 'processing' || isModelOptionsLoading || modelOptions.length === 0}
        >
          {modelOptions.length === 0 && <option value="">No model</option>}
          {modelOptions.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="show-thinking">
          <input
            id="show-thinking"
            type="checkbox"
            checked={showThinking}
            onChange={(event) => onShowThinkingChange(event.target.checked)}
            disabled={status === 'processing'}
          />
          Include thinking layer
        </label>
      </div>

      <div>
        <button type="button" onClick={onOpenSettings}>
          API Key Settings
        </button>
      </div>

      <div>
        <label htmlFor="vibe">Vibe / Requirement</label>
        <textarea
          id="vibe"
          rows={10}
          value={vibe}
          onChange={(event) => onVibeChange(event.target.value)}
          placeholder="Describe your idea in plain language."
          disabled={status === 'processing'}
        />
      </div>

      <div>
        <button type="button" onClick={onTransmute} disabled={status === 'processing' || !vibe.trim()}>
          {status === 'processing' ? 'Processing...' : 'Start Transmutation'}
        </button>
      </div>
    </section>
  );
}

