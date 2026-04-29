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
} from 'recharts';
import { Mic, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import type { BPReading, DayPeriod, PeriodFilter } from '../types';
import {
  classifyBP,
  BP_CATEGORY_LABELS,
  BP_CATEGORY_BADGE,
  DAY_PERIOD_LABELS,
  formatDateTime,
  formatShortDate,
  filterByPeriod,
  generateId,
  getDayPeriod,
  getDayPeriodFromTimestamp,
} from '../utils/health';
import { bpStorage } from '../utils/storage';
import { useSpeech } from '../hooks/useSpeech';
import { PeriodSelector } from '../components/PeriodSelector';
import { StatCard } from '../components/StatCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

function parseBPSpeech(text: string): Partial<{ systolic: string; diastolic: string; pulse: string }> {
  const t = text.toLowerCase();
  const overMatch = t.match(/(\d{2,3})\s*(?:over|\/|and)\s*(\d{2,3})/);
  const pulseMatch = t.match(/(?:pulse|heart rate|hr)\s*(\d{2,3})/);
  return {
    systolic: overMatch?.[1],
    diastolic: overMatch?.[2],
    pulse: pulseMatch?.[1],
  };
}

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

const DAY_PERIODS: DayPeriod[] = ['morning', 'noon', 'evening', 'night'];

export function BPPage() {
  const [readings, setReadings] = useState<BPReading[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [editPeriod, setEditPeriod] = useState<DayPeriod>('morning');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const speech = useSpeech();
  const prevTranscript = useRef('');

  useEffect(() => {
    setReadings(bpStorage.getAll());
  }, []);

  useEffect(() => {
    if (!speech.transcript || speech.transcript === prevTranscript.current) return;
    prevTranscript.current = speech.transcript;

    const parsed = parseBPSpeech(speech.transcript);
    if (parsed.systolic) setSystolic(parsed.systolic);
    if (parsed.diastolic) setDiastolic(parsed.diastolic);
    if (parsed.pulse) setPulse(parsed.pulse);
    speech.reset();
  }, [speech.transcript]);

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNote('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    if (!sys || !dia || sys < 60 || sys > 300 || dia < 30 || dia > 200) return;

    if (editingId) {
      const target = readings.find((r) => r.id === editingId);
      if (!target) return;
      bpStorage.update({
        ...target,
        systolic: sys,
        diastolic: dia,
        pulse: pulse ? parseInt(pulse, 10) : undefined,
        note: note.trim() || undefined,
        dayPeriod: editPeriod,
      });
    } else {
      const now = new Date();
      bpStorage.add({
        id: generateId(),
        systolic: sys,
        diastolic: dia,
        pulse: pulse ? parseInt(pulse, 10) : undefined,
        note: note.trim() || undefined,
        timestamp: now.toISOString(),
        dayPeriod: getDayPeriod(now),
      });
    }

    setReadings(bpStorage.getAll());
    resetForm();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const handleEdit = (reading: BPReading) => {
    setEditingId(reading.id);
    setSystolic(String(reading.systolic));
    setDiastolic(String(reading.diastolic));
    setPulse(reading.pulse ? String(reading.pulse) : '');
    setNote(reading.note ?? '');
    setEditPeriod(reading.dayPeriod ?? getDayPeriodFromTimestamp(reading.timestamp));
  };

  const handleDelete = (id: string) => {
    bpStorage.remove(id);
    setReadings(bpStorage.getAll());
    setDeleteId(null);
  };

  const filtered = filterByPeriod(readings, period);
  const chartData = [...filtered]
    .reverse()
    .map((r) => ({
      date: formatShortDate(r.timestamp),
      Systolic: r.systolic,
      Diastolic: r.diastolic,
      ...(r.pulse ? { Pulse: r.pulse } : {}),
    }));

  const avg = filtered.length
    ? {
        sys: Math.round(filtered.reduce((s, r) => s + r.systolic, 0) / filtered.length),
        dia: Math.round(filtered.reduce((s, r) => s + r.diastolic, 0) / filtered.length),
      }
    : null;

  const latest = readings[0];

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Blood Pressure</h2>
        <p className="text-slate-400 text-sm mt-1">Track systolic / diastolic and trends over time</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-400" />
          {editingId ? 'Edit Reading' : 'Add Reading'}
        </h3>

        <div className="mb-4 p-3 bg-slate-800/60 rounded-xl">
          <p className="text-xs text-slate-400">Voice input</p>
          <p className="text-sm text-slate-300 truncate">
            {speech.isListening
              ? 'Listening... say "120 over 80 pulse 72"'
              : speech.transcript
              ? `Heard: "${speech.transcript}"`
              : 'Tap floating mic at bottom-right to speak'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Systolic (mmHg) *</label>
              <input
                className="input-field"
                type="number"
                min={60}
                max={300}
                placeholder="120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Diastolic (mmHg) *</label>
              <input
                className="input-field"
                type="number"
                min={30}
                max={200}
                placeholder="80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Pulse (optional)</label>
              <input
                className="input-field"
                type="number"
                min={30}
                max={250}
                placeholder="72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
              />
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
                        ? 'bg-blue-600 text-white'
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
              placeholder="after exercise, resting, etc"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary self-start">
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
          <StatCard label="Latest Systolic" value={latest.systolic} sub="mmHg" color="blue" />
          <StatCard label="Latest Diastolic" value={latest.diastolic} sub="mmHg" color="orange" />
          {latest.pulse && <StatCard label="Latest Pulse" value={latest.pulse} sub="bpm" color="green" />}
          {avg && <StatCard label="Avg (period)" value={`${avg.sys}/${avg.dia}`} sub="systolic / diastolic" color="blue" />}
        </div>
      )}

      {filtered.length > 1 && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-semibold text-slate-200">Trend</h3>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
              <Area type="monotone" dataKey="Systolic" stroke="#3b82f6" fill="url(#gSys)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Diastolic" stroke="#f97316" fill="url(#gDia)" strokeWidth={2} dot={false} />
              {chartData.some((d) => 'Pulse' in d) && (
                <Area type="monotone" dataKey="Pulse" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              )}
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
              const cat = classifyBP(r.systolic, r.diastolic);
              const periodValue = r.dayPeriod ?? getDayPeriodFromTimestamp(r.timestamp);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-slate-100 tabular-nums">
                        {r.systolic}/{r.diastolic}
                      </span>
                      {r.pulse && <span className="text-sm text-emerald-400 tabular-nums">HR {r.pulse}</span>}
                      <span className={BP_CATEGORY_BADGE[cat]}>{BP_CATEGORY_LABELS[cat]}</span>
                      <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                        {DAY_PERIOD_LABELS[periodValue]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(r.timestamp)}</p>
                    {r.note && <p className="text-xs text-slate-400 mt-0.5 italic">{r.note}</p>}
                  </div>
                  <button
                    onClick={() => handleEdit(r)}
                    className="btn-icon shrink-0 text-slate-500 hover:text-blue-400"
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
