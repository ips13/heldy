import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Mic, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import type { DayPeriod, MealContext, PeriodFilter, SugarReading, SugarUnit } from '../types';
import {
  classifySugar,
  SUGAR_CATEGORY_LABELS,
  SUGAR_CATEGORY_BADGE,
  DAY_PERIOD_LABELS,
  formatDateTime,
  formatShortDate,
  filterByPeriod,
  generateId,
  getDayPeriod,
  getDayPeriodFromTimestamp,
  mgdlToMmol,
  mmolToMgdl,
} from '../utils/health';
import { sugarStorage } from '../utils/storage';
import { useSpeech } from '../hooks/useSpeech';
import { PeriodSelector } from '../components/PeriodSelector';
import { StatCard } from '../components/StatCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

const MEAL_CONTEXT_LABELS: Record<MealContext, string> = {
  fasting: 'Fasting',
  'before-meal': 'Before Meal',
  'after-meal': 'After Meal',
  bedtime: 'Bedtime',
  random: 'Random',
};

const DAY_PERIODS: DayPeriod[] = ['morning', 'noon', 'evening', 'night'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function SugarPage() {
  const [readings, setReadings] = useState<SugarReading[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<SugarUnit>('mg/dL');
  const [mealContext, setMealContext] = useState<MealContext>('fasting');
  const [note, setNote] = useState('');
  const [editPeriod, setEditPeriod] = useState<DayPeriod>('morning');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const speech = useSpeech();
  const prevTranscript = useRef('');

  useEffect(() => {
    setReadings(sugarStorage.getAll());
  }, []);

  useEffect(() => {
    if (!speech.transcript || speech.transcript === prevTranscript.current) return;
    prevTranscript.current = speech.transcript;
    const num = speech.transcript.match(/\d+(\.\d+)?/)?.[0] ?? '';
    if (num) setValue(num);
    speech.reset();
  }, [speech.transcript]);

  const resetForm = () => {
    setValue('');
    setUnit('mg/dL');
    setMealContext('fasting');
    setNote('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (!numVal || numVal <= 0) return;

    if (editingId) {
      const target = readings.find((r) => r.id === editingId);
      if (!target) return;
      sugarStorage.update({
        ...target,
        value: numVal,
        unit,
        mealContext,
        note: note.trim() || undefined,
        dayPeriod: editPeriod,
      });
    } else {
      const now = new Date();
      sugarStorage.add({
        id: generateId(),
        value: numVal,
        unit,
        mealContext,
        note: note.trim() || undefined,
        timestamp: now.toISOString(),
        dayPeriod: getDayPeriod(now),
      });
    }

    setReadings(sugarStorage.getAll());
    resetForm();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const handleEdit = (reading: SugarReading) => {
    setEditingId(reading.id);
    setValue(String(reading.value));
    setUnit(reading.unit);
    setMealContext(reading.mealContext);
    setNote(reading.note ?? '');
    setEditPeriod(reading.dayPeriod ?? getDayPeriodFromTimestamp(reading.timestamp));
  };

  const handleDelete = (id: string) => {
    sugarStorage.remove(id);
    setReadings(sugarStorage.getAll());
    setDeleteId(null);
  };

  const filtered = filterByPeriod(readings, period);
  const chartData = [...filtered]
    .reverse()
    .map((r) => ({
      date: formatShortDate(r.timestamp),
      'Blood Sugar': r.unit === 'mmol/L' ? mmolToMgdl(r.value) : r.value,
    }));

  const latest = readings[0];
  const avg = filtered.length
    ? Math.round(
        filtered.reduce((s, r) => s + (r.unit === 'mmol/L' ? mmolToMgdl(r.value) : r.value), 0) /
          filtered.length,
      )
    : null;

  const hba1c = avg ? ((avg + 46.7) / 28.7).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Blood Sugar</h2>
        <p className="text-slate-400 text-sm mt-1">Track glucose levels and see your trends</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-orange-400" />
          {editingId ? 'Edit Reading' : 'Add Reading'}
        </h3>

        <div className="mb-4 p-3 bg-slate-800/60 rounded-xl">
          <p className="text-xs text-slate-400">Voice input</p>
          <p className="text-sm text-slate-300 truncate">
            {speech.isListening
              ? 'Listening... say glucose value, for example "108"'
              : speech.transcript
              ? `Heard: "${speech.transcript}"`
              : 'Tap floating mic at bottom-right to speak'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Glucose Value *</label>
            <div className="flex gap-2">
              <input
                className="input-field"
                type="number"
                step="0.1"
                min={1}
                max={1000}
                placeholder={unit === 'mg/dL' ? '100' : '5.5'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <div className="flex rounded-xl overflow-hidden border border-slate-700">
                {(['mg/dL', 'mmol/L'] as SugarUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      unit === u
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">When taken?</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(MEAL_CONTEXT_LABELS) as MealContext[]).map((ctx) => (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => setMealContext(ctx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    mealContext === ctx
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {MEAL_CONTEXT_LABELS[ctx]}
                </button>
              ))}
            </div>
          </div>

          {editingId && (
            <div>
              <label className="label">Time of Day</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      editPeriod === p
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {DAY_PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Note (optional)</label>
            <input
              className="input-field"
              type="text"
              placeholder="post-meal, exercise, fasting, etc"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary self-start" style={{ backgroundColor: '#ea580c' }}>
              {saved ? 'Saved' : editingId ? 'Save Changes' : 'Save Reading'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Latest"
            value={latest.unit === 'mmol/L' ? `${latest.value} mmol/L` : `${latest.value} mg/dL`}
            sub={MEAL_CONTEXT_LABELS[latest.mealContext]}
            color="orange"
          />
          {avg && <StatCard label={`Avg (${period})`} value={`${avg} mg/dL`} sub={`~ ${mgdlToMmol(avg)} mmol/L`} color="orange" />}
          {hba1c && <StatCard label="Est. HbA1c" value={`${hba1c}%`} sub="ADAG estimate" color="green" />}
          <StatCard label="Total" value={readings.length} sub="all time" color="blue" />
        </div>
      )}

      {filtered.length > 1 && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-semibold text-slate-200">Trend (mg/dL)</h3>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gSugar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
              <ReferenceLine y={70} stroke="#38bdf8" strokeDasharray="4 2" />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 2" />
              <ReferenceLine y={126} stroke="#f59e0b" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="Blood Sugar" stroke="#f97316" fill="url(#gSugar)" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-semibold text-slate-200">History</h3>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No readings for this period.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((r) => {
              const cat = classifySugar(r.value, r.unit);
              const mgdl = r.unit === 'mmol/L' ? mmolToMgdl(r.value) : r.value;
              const mmol = r.unit === 'mg/dL' ? mgdlToMmol(r.value) : r.value;
              const periodValue = r.dayPeriod ?? getDayPeriodFromTimestamp(r.timestamp);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-slate-100 tabular-nums">{mgdl} mg/dL</span>
                      <span className="text-sm text-slate-500 tabular-nums">({mmol} mmol/L)</span>
                      <span className={SUGAR_CATEGORY_BADGE[cat]}>{SUGAR_CATEGORY_LABELS[cat]}</span>
                      <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">{MEAL_CONTEXT_LABELS[r.mealContext]}</span>
                      <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">{DAY_PERIOD_LABELS[periodValue]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(r.timestamp)}</p>
                    {r.note && <p className="text-xs text-slate-400 mt-0.5 italic">{r.note}</p>}
                  </div>
                  <button
                    onClick={() => handleEdit(r)}
                    className="btn-icon shrink-0 text-slate-500 hover:text-orange-400"
                    title="Edit reading"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="btn-icon shrink-0 text-slate-500 hover:text-red-400"
                    title="Delete reading"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`floating-mic ${speech.isListening ? 'floating-mic-live' : ''}`}
        onClick={() => (speech.isListening ? speech.stop() : speech.start())}
        title={speech.isListening ? 'Stop voice input' : 'Start voice input'}
      >
        <Mic className="w-6 h-6" />
      </button>

      {deleteId && (
        <ConfirmDeleteModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
