import type { CustomDateRange, PeriodFilter } from '../types';

const OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  value: PeriodFilter;
  onChange: (p: PeriodFilter) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

export function PeriodSelector({ value, onChange, customRange, onCustomRangeChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            value === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex items-center gap-2 mt-2 w-full flex-wrap">
          <input
            type="date"
            className="input-field text-sm flex-1 min-w-0"
            value={customRange?.from ?? ''}
            max={customRange?.to ?? undefined}
            onChange={(e) =>
              onCustomRangeChange?.({ from: e.target.value, to: customRange?.to ?? '' })
            }
          />
          <span className="text-slate-400 text-sm shrink-0">to</span>
          <input
            type="date"
            className="input-field text-sm flex-1 min-w-0"
            value={customRange?.to ?? ''}
            min={customRange?.from ?? undefined}
            onChange={(e) =>
              onCustomRangeChange?.({ from: customRange?.from ?? '', to: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}
