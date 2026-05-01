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
import type { BPReading, CustomDateRange, DayPeriod, PeriodFilter } from '../types';
import {
  classifyBP,
  BP_CATEGORY_LABELS,
  BP_CATEGORY_BADGE,
  DAY_PERIOD_LABELS,
  formatDateTime,
  formatDateTimeInputValue,
  formatShortDate,
  filterByPeriod,
  generateId,
  getDayPeriod,
  getDayPeriodFromTimestamp,
  toIsoFromDateTimeInput,
} from '../utils/health';
import { bpStorage } from '../utils/storage';
import { useSpeech } from '../hooks/useSpeech';
import { PeriodSelector } from '../components/PeriodSelector';
import { StatCard } from '../components/StatCard';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { BottomSheet } from '../components/BottomSheet';
import { VoiceInputSheet } from '../components/VoiceInputSheet';

function parseSmallNumberWords(words: string[]): number | null {
  const singles: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };
  const tens: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  let total = 0;
  let current = 0;

  for (const word of words) {
    if (word === 'and') continue;
    if (word in singles) {
      current += singles[word];
      continue;
    }
    if (word in tens) {
      current += tens[word];
      continue;
    }
    if (word === 'hundred') {
      current = (current || 1) * 100;
      continue;
    }
    return null;
  }

  total += current;
  return total > 0 ? total : null;
}

function normalizeWordNumbers(text: string): string {
  const tokens = text.split(/\s+/);
  const numberWords = new Set([
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
    'hundred',
    'and',
  ]);

  const normalized: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    if (!numberWords.has(tokens[index])) {
      normalized.push(tokens[index]);
      index += 1;
      continue;
    }

    let end = index;
    while (end < tokens.length && numberWords.has(tokens[end])) end += 1;

    const value = parseSmallNumberWords(tokens.slice(index, end));
    if (value === null) {
      normalized.push(...tokens.slice(index, end));
    } else {
      normalized.push(String(value));
    }
    index = end;
  }

  return normalized.join(' ');
}

function parseBPSpeech(text: string): Partial<{ systolic: string; diastolic: string; pulse: string; note: string }> {
  const normalizedText = normalizeWordNumbers(
    text
      .toLowerCase()
      .replace(/\bby\b/g, ' over ')
      .replace(/[-,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  const bpMatch = normalizedText.match(/(\d{2,3})\s*(?:over|\/|and)\s*(\d{2,3})/);
  if (!bpMatch) return {};

  let workingText = normalizedText.replace(bpMatch[0], ' ').replace(/\s+/g, ' ').trim();
  const pulseMatch = workingText.match(/(?:pulse|heart rate|hr)\s*(\d{2,3})/);
  let pulse = pulseMatch?.[1];

  if (pulseMatch) {
    workingText = workingText.replace(pulseMatch[0], ' ');
  } else {
    const leadingNumberMatch = workingText.match(/^(\d{2,3})(?:\s|$)/);
    if (leadingNumberMatch) {
      pulse = leadingNumberMatch[1];
      workingText = workingText.replace(leadingNumberMatch[0], ' ');
    }
  }

  return {
    systolic: bpMatch[1],
    diastolic: bpMatch[2],
    pulse,
    note: workingText.replace(/\s+/g, ' ').trim() || undefined,
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
  const [entryDateTime, setEntryDateTime] = useState(() => formatDateTimeInputValue());
  const [editingReading, setEditingReading] = useState<BPReading | null>(null);
  const [editSystolic, setEditSystolic] = useState('');
  const [editDiastolic, setEditDiastolic] = useState('');
  const [editPulse, setEditPulse] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDateTime, setEditDateTime] = useState(() => formatDateTimeInputValue());
  const [editPeriod, setEditPeriod] = useState<DayPeriod>('morning');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: '', to: '' });
  const speech = useSpeech();
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setReadings(bpStorage.getAll());
  }, []);

  const handleVoiceConfirm = () => {
    const parsed = parseBPSpeech(speech.transcript);
    if (parsed.systolic) setSystolic(parsed.systolic);
    if (parsed.diastolic) setDiastolic(parsed.diastolic);
    if (parsed.pulse) setPulse(parsed.pulse);
    if (parsed.note) setNote(parsed.note);
    speech.stop();
    speech.reset();
    setIsVoiceSheetOpen(false);
  };

  const handleVoiceRetake = () => {
    speech.stop();
    speech.reset();
    speech.start();
  };

  const handleVoiceOpen = () => {
    speech.stop();
    speech.reset();
    setIsVoiceSheetOpen(true);
    speech.start();
  };

  const handleVoiceClose = () => {
    speech.stop();
    speech.reset();
    setIsVoiceSheetOpen(false);
  };

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNote('');
    setEntryDateTime(formatDateTimeInputValue());
  };

  const showSavedState = () => {
    setSaved(true);
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => setSaved(false), 1600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    if (!sys || !dia || sys < 60 || sys > 300 || dia < 30 || dia > 200) return;

    const timestamp = toIsoFromDateTimeInput(entryDateTime);
    const entryDate = new Date(timestamp);
    bpStorage.add({
      id: generateId(),
      systolic: sys,
      diastolic: dia,
      pulse: pulse ? parseInt(pulse, 10) : undefined,
      note: note.trim() || undefined,
      timestamp,
      dayPeriod: getDayPeriod(entryDate),
    });

    setReadings(bpStorage.getAll());
    resetForm();
    showSavedState();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReading) return;
    const sys = parseInt(editSystolic, 10);
    const dia = parseInt(editDiastolic, 10);
    if (!sys || !dia || sys < 60 || sys > 300 || dia < 30 || dia > 200) return;

    bpStorage.update({
      ...editingReading,
      systolic: sys,
      diastolic: dia,
      pulse: editPulse ? parseInt(editPulse, 10) : undefined,
      note: editNote.trim() || undefined,
      timestamp: toIsoFromDateTimeInput(editDateTime),
      dayPeriod: editPeriod,
    });

    setReadings(bpStorage.getAll());
    setEditingReading(null);
    showSavedState();
  };

  const handleEdit = (reading: BPReading) => {
    setEditingReading(reading);
    setEditSystolic(String(reading.systolic));
    setEditDiastolic(String(reading.diastolic));
    setEditPulse(reading.pulse ? String(reading.pulse) : '');
    setEditNote(reading.note ?? '');
    setEditDateTime(formatDateTimeInputValue(reading.timestamp));
    setEditPeriod(reading.dayPeriod ?? getDayPeriodFromTimestamp(reading.timestamp));
  };

  const handleDelete = (id: string) => {
    bpStorage.remove(id);
    setReadings(bpStorage.getAll());
    setDeleteId(null);
  };

  const filtered = filterByPeriod(readings, period, customRange);
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
          Add Reading
        </h3>

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

          <div>
            <label className="label">Date & Time</label>
            <input
              className="input-field"
              type="datetime-local"
              value={entryDateTime}
              max={formatDateTimeInputValue()}
              onChange={(e) => setEntryDateTime(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary self-start">
              {saved ? 'Saved' : 'Save Reading'}
            </button>
          </div>
          {speech.isSupported && (
            <p className="text-xs text-slate-500">
              Tap the mic button at the bottom-right to speak a reading (e.g. "120 over 80 pulse 72").
            </p>
          )}
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
            <PeriodSelector value={period} onChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />
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
          <PeriodSelector value={period} onChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />
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
        onClick={handleVoiceOpen}
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

      {editingReading && (
        <BottomSheet
          title="Edit Reading"
          subtitle={formatDateTime(editingReading.timestamp)}
          onClose={() => setEditingReading(null)}
        >
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Systolic (mmHg) *</label>
                <input
                  className="input-field"
                  type="number"
                  min={60}
                  max={300}
                  value={editSystolic}
                  onChange={(e) => setEditSystolic(e.target.value)}
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
                  value={editDiastolic}
                  onChange={(e) => setEditDiastolic(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Pulse</label>
                <input
                  className="input-field"
                  type="number"
                  min={30}
                  max={250}
                  value={editPulse}
                  onChange={(e) => setEditPulse(e.target.value)}
                />
              </div>
            </div>

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

            <div>
              <label className="label">Date & Time</label>
              <input
                className="input-field"
                type="datetime-local"
                value={editDateTime}
                max={formatDateTimeInputValue()}
                onChange={(e) => setEditDateTime(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Note (optional)</label>
              <input
                className="input-field"
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setEditingReading(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Save Changes
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {isVoiceSheetOpen && (
        <VoiceInputSheet
          transcript={speech.transcript}
          isListening={speech.isListening}
          accentClassName="bg-gradient-to-br from-blue-600 to-cyan-500"
          exampleText="120 over 80 pulse 72"
          onConfirm={handleVoiceConfirm}
          onRetake={handleVoiceRetake}
          onCancel={handleVoiceClose}
        />
      )}
    </div>
  );
}
