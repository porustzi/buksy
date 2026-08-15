import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'monospace' }}>
          <div style={{ maxWidth: 600, textAlign: 'center' }}>
            <h1 style={{ color: '#e53935', fontSize: 20, marginBottom: 12 }}>Помилка</h1>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#f88', background: '#1a1a1a', padding: 16, borderRadius: 8 }}>{this.state.error.message}</pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, padding: '10px 20px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Перезавантажити
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
