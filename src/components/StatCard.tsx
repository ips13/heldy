interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'orange' | 'green' | 'red';
  compact?: boolean;
}

const COLOR_MAP = {
  blue: 'text-blue-400',
  orange: 'text-orange-400',
  green: 'text-emerald-400',
  red: 'text-red-400',
};

export function StatCard({ label, value, sub, color = 'blue', compact = false }: Props) {
  if (compact) {
    return (
      <div className="border rounded-lg p-2.5 shadow-lg bg-slate-900/50 border-slate-700/60">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`text-xl font-bold tabular-nums block ${COLOR_MAP[color]}`}>{value}</span>
        {sub && <span className="text-[11px] text-slate-500 mt-0.5 block">{sub}</span>}
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <span className="label">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${COLOR_MAP[color]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}
