import { Activity, Droplets, HeartPulse, TrendingUp } from 'lucide-react';
import type { BPReading, SugarReading, ActiveTab } from '../types';
import {
  classifyBP,
  BP_CATEGORY_LABELS,
  BP_CATEGORY_BADGE,
  classifySugar,
  SUGAR_CATEGORY_LABELS,
  SUGAR_CATEGORY_BADGE,
  formatDateTime,
  mgdlToMmol,
  mmolToMgdl,
} from '../utils/health';

interface Props {
  bpReadings: BPReading[];
  sugarReadings: SugarReading[];
  onNavigate: (tab: ActiveTab) => void;
}

function QuickTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-blue-950/40 border border-blue-900/40 rounded-xl">
      <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-300">{text}</p>
    </div>
  );
}

export function DashboardPage({ bpReadings, sugarReadings, onNavigate }: Props) {
  const latestBP = bpReadings[0];
  const latestSugar = sugarReadings[0];

  const bpCat = latestBP ? classifyBP(latestBP.systolic, latestBP.diastolic) : null;
  const sugarCat = latestSugar ? classifySugar(latestSugar.value, latestSugar.unit) : null;

  const sugarMgdl = latestSugar
    ? latestSugar.unit === 'mmol/L'
      ? mmolToMgdl(latestSugar.value)
      : latestSugar.value
    : null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Hero greeting */}
      <div className="card bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-900/40">
        <div className="flex items-center gap-3 mb-2">
          <HeartPulse className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">Good day!</h2>
            <p className="text-slate-400 text-sm">Here's your health snapshot.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center text-sm text-slate-400">
            <span className="block text-2xl font-bold text-blue-400">{bpReadings.length}</span>
            BP Readings
          </div>
          <div className="text-center text-sm text-slate-400">
            <span className="block text-2xl font-bold text-orange-400">{sugarReadings.length}</span>
            Sugar Readings
          </div>
        </div>
      </div>

      {/* Latest BP */}
      <div
        className="card cursor-pointer hover:border-blue-700 transition-colors"
        onClick={() => onNavigate('bp')}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-slate-200">Blood Pressure</h3>
          <span className="ml-auto text-xs text-slate-500">tap to view →</span>
        </div>

        {latestBP && bpCat ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-100 tabular-nums">
                {latestBP.systolic}/{latestBP.diastolic}
              </span>
              <span className="text-slate-400">mmHg</span>
              {latestBP.pulse && (
                <span className="text-emerald-400 text-sm ml-2">♥ {latestBP.pulse} bpm</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={BP_CATEGORY_BADGE[bpCat]}>{BP_CATEGORY_LABELS[bpCat]}</span>
              <span className="text-xs text-slate-500">{formatDateTime(latestBP.timestamp)}</span>
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm">No readings yet. Add your first BP reading.</p>
        )}
      </div>

      {/* Latest Sugar */}
      <div
        className="card cursor-pointer hover:border-orange-700 transition-colors"
        onClick={() => onNavigate('sugar')}
      >
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-slate-200">Blood Sugar</h3>
          <span className="ml-auto text-xs text-slate-500">tap to view →</span>
        </div>

        {latestSugar && sugarCat && sugarMgdl ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-100 tabular-nums">{sugarMgdl}</span>
              <span className="text-slate-400">mg/dL</span>
              <span className="text-slate-500 text-sm ml-1">
                ({mgdlToMmol(sugarMgdl)} mmol/L)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={SUGAR_CATEGORY_BADGE[sugarCat]}>
                {SUGAR_CATEGORY_LABELS[sugarCat]}
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(latestSugar.timestamp)}</span>
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm">No readings yet. Add your first sugar reading.</p>
        )}
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-slate-300 text-sm">Health Tips</h3>
        <QuickTip text="Measure BP at the same time each day for consistent trends." />
        <QuickTip text="Fasting glucose is most accurate — take it before your first meal." />
        <QuickTip text="Regular light exercise can lower both blood pressure and blood sugar." />
      </div>

      {/* Reference ranges */}
      <div className="card">
        <h3 className="font-semibold text-slate-300 mb-3">Reference Ranges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-400" /> Blood Pressure
            </p>
            <div className="space-y-1">
              {[
                ['Normal', '< 120/80', 'badge-ok'],
                ['Elevated', '120–129 / < 80', 'badge-warn'],
                ['High Stage 1', '130–139 / 80–89', 'badge-warn'],
                ['High Stage 2', '≥ 140 / ≥ 90', 'badge-high'],
                ['Low', '< 90/60', 'badge-low'],
              ].map(([label, range, badge]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className={badge}>{label}</span>
                  <span className="text-slate-500 tabular-nums">{range}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <Droplets className="w-4 h-4 text-orange-400" /> Blood Sugar (fasting mg/dL)
            </p>
            <div className="space-y-1">
              {[
                ['Low', '< 70', 'badge-low'],
                ['Normal', '70 – 99', 'badge-ok'],
                ['Pre-diabetic', '100 – 125', 'badge-warn'],
                ['Diabetic range', '≥ 126', 'badge-high'],
              ].map(([label, range, badge]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className={badge}>{label}</span>
                  <span className="text-slate-500 tabular-nums">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
