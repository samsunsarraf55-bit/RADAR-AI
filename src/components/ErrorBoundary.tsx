import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Terminal Error Boundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    try {
      sessionStorage.removeItem('samsun_sarraf_temp');
    } catch {}
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Görünüm Kurtarıldı
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                Beklenmeyen bir veri akışı veya ekran hatası algılandı ve siyah ekran oluşması engellenerek terminal korumaya alındı.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left font-mono text-xs text-rose-400 overflow-x-auto max-h-32">
                <span className="text-slate-500 block text-[10px] mb-1">Hata Ayrıntısı:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ekranı Yeniden Başlat</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Sayfayı Yenile</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SectionProps {
  children: ReactNode;
  fallbackTitle?: string;
}

export class SectionErrorBoundary extends Component<SectionProps, State> {
  constructor(props: SectionProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Section Error caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 text-center space-y-2.5 my-2">
          <div className="flex items-center justify-center space-x-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{this.props.fallbackTitle || 'Bu bölüm yenileniyor...'}</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Veri akışında anlık bir uyumsuzluk algılandı. Diğer bölümler aktif olarak çalışmaya devam ediyor.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg text-xs transition inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Bölümü Yeniden Yükle</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
