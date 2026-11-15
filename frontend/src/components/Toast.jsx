import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-rose-500',
    info: 'text-blue-500',
  };

  const Icon = icons[toast.type] || Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${colors[toast.type] || colors.info}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
        <div className="flex-1 text-xs">
          {toast.title && <div className="font-semibold text-slate-900 mb-0.5">{toast.title}</div>}
          <div className="leading-relaxed">{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
