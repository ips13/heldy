interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'orange' | 'green' | 'red';
}

const COLOR_MAP = {
  blue: 'text-blue-400',
  orange: 'text-orange-400',
  green: 'text-emerald-400',
  red: 'text-red-400',
};

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <span className="label">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${COLOR_MAP[color]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}
