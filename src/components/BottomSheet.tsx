import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ title, subtitle, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="bottom-sheet relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-700" />
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-100">{title}</p>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn-icon shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}