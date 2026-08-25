import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : t.type === 'error'
            ? 'bg-rose-600 border-rose-500 text-white'
            : 'bg-indigo-600 border-indigo-500 text-white';

        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
            ? AlertCircle
            : Info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 border transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="max-w-xs">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="ml-2 hover:opacity-80 p-0.5"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
