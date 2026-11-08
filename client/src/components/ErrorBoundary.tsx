import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erreur interceptée par le bouclier:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleClose = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-dark-950/95 border border-dark-800 rounded-2xl shadow-2xl m-4 text-white z-50 animate-in fade-in max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {this.props.fallbackTitle || 'Affichage temporairement indisponible'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Un incident d'affichage a été intercepté pour protéger votre session. Vous pouvez relancer le composant ou fermer cette vue en toute sécurité.
          </p>

          {this.state.error?.message && (
            <div className="text-[11px] font-mono text-rose-300 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg max-w-md mb-4 break-words">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
            {this.props.onClose && (
              <button
                type="button"
                onClick={this.handleClose}
                className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fermer</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
