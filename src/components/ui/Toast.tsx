import React, { useEffect } from 'react';
import type { NotificationType } from '../../stores/notificationsStore';

interface ToastProps {
  id: number;
  message: string;
  type: NotificationType;
  onClose: (id: number) => void;
}

// Ícones SVG para cada tipo de notificação
const Icons = {
  success: (
    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Configurações de cores para cada tipo
const toastStyles = {
  success: {
    container: 'bg-slate-800/95 border-emerald-500/50 shadow-emerald-500/10',
    iconBg: 'bg-emerald-500/10',
    progress: 'bg-emerald-500',
  },
  error: {
    container: 'bg-slate-800/95 border-rose-500/50 shadow-rose-500/10',
    iconBg: 'bg-rose-500/10',
    progress: 'bg-rose-500',
  },
  warning: {
    container: 'bg-slate-800/95 border-amber-500/50 shadow-amber-500/10',
    iconBg: 'bg-amber-500/10',
    progress: 'bg-amber-500',
  },
  info: {
    container: 'bg-slate-800/95 border-sky-500/50 shadow-sky-500/10',
    iconBg: 'bg-sky-500/10',
    progress: 'bg-sky-500',
  },
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const styles = toastStyles[type] || toastStyles.info;

  return (
    <div
      className={`
        fixed top-20 right-4 z-[100] max-w-sm w-full
        rounded-xl border backdrop-blur-sm
        shadow-lg transform transition-all duration-500 ease-out
        animate-slide-in
        ${styles.container}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Ícone com fundo circular */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
          {Icons[type]}
        </div>

        {/* Mensagem */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/95 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Botão de fechar */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
                     text-white/50 hover:text-white hover:bg-white/10
                     transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="h-0.5 bg-white/10 overflow-hidden">
        <div
          className={`h-full ${styles.progress} animate-progress`}
          style={{ animationDuration: '5s' }}
        />
      </div>
    </div>
  );
};

// Container para múltiplos toasts
export const ToastContainer: React.FC<{
  toasts: Array<{ id: number; message: string; type: NotificationType }>;
  onClose: (id: number) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast id={toast.id} message={toast.message} type={toast.type} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
