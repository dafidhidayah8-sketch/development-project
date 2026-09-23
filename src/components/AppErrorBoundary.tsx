import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application runtime error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', padding: '32px', fontFamily: 'Arial, sans-serif', background: '#f8fafc' }}>
        <div style={{ maxWidth: '760px', margin: '48px auto', background: '#fff', border: '1px solid #fecaca', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(15,23,42,.08)' }}>
          <h1 style={{ margin: 0, color: '#991b1b', fontSize: '22px' }}>Aplikasi mengalami error</h1>
          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            Error ini terjadi saat aplikasi berjalan di browser, bukan saat HTML awal dimuat.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fef2f2', color: '#7f1d1d', padding: '16px', borderRadius: '10px', overflowX: 'auto' }}>
            {this.state.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '10px 16px', border: 0, borderRadius: '10px', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }
}
