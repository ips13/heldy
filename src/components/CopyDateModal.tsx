import { Copy, X } from 'lucide-react';

interface Props {
  onUseEntryDate: () => void;
  onUseToday: () => void;
  onCancel: () => void;
}

export function CopyDateModal({ onUseEntryDate, onUseToday, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <Copy className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-100">Copy reading</p>
            <p className="text-sm text-slate-400 mt-1">Which date should the copied entry use?</p>
          </div>
          <button onClick={onCancel} className="ml-auto btn-icon shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 justify-end flex-wrap">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onUseEntryDate} className="btn-secondary">Entry Date</button>
          <button onClick={onUseToday} className="btn-primary">Today</button>
        </div>
      </div>
    </div>
  );
}
