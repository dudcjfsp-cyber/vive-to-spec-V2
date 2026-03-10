import React from 'react';
import WorkspaceStatusCard from './WorkspaceStatusCard.jsx';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export default class ResultPanelBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: toText(error?.message, '알 수 없는 오류'),
    };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('ResultPanelBoundary caught an error.', error, info);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <WorkspaceStatusCard
          tone="error"
          title="세부 결과를 여는 중 문제가 생겼습니다"
          body={this.state.errorMessage
            ? `오류: ${this.state.errorMessage}`
            : '지금은 세부 결과를 안전하게 열지 못했습니다.'}
          items={[
            '입력과 생성 결과는 그대로 유지됩니다.',
            '모드를 다시 열거나 다시 생성하면 다시 시도합니다.',
          ]}
        />
      );
    }

    return this.props.children;
  }
}
