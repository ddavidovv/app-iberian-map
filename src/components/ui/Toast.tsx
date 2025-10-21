import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    bgColor: 'bg-gradient-to-r from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    titleColor: 'text-emerald-900',
    messageColor: 'text-emerald-700',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  error: {
    bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
    borderColor: 'border-red-200',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  warning: {
    bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    titleColor: 'text-amber-900',
    messageColor: 'text-amber-700',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
};

export function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
  const config = toastConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        border rounded-lg shadow-lg backdrop-blur-sm
        overflow-hidden animate-in fade-in slide-in-from-right-5 duration-300
      `}
      role="alert"
    >
      <div className="p-4 flex items-start gap-3">
        <IconComponent className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${config.titleColor}`}>{title}</h3>
          {message && (
            <p className={`text-sm ${config.messageColor} mt-1`}>{message}</p>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
