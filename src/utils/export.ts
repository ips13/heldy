import { format, parseISO } from 'date-fns';
import type { BPReading, SugarReading } from '../types';
import { getDayPeriodFromTimestamp } from './health';
import type { AppBackupData } from './storage';

function escapeCsv(value: string | number | undefined): string {
  if (value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toDateParts(timestamp: string): { date: string; time: string } {
  const date = parseISO(timestamp);
  return {
    date: format(date, 'yyyy-MM-dd'),
    time: format(date, 'HH:mm'),
  };
}

export function buildCombinedCsv(bpReadings: BPReading[], sugarReadings: SugarReading[]): string {
  const rows: Array<Array<string | number>> = [
    [
      'Date',
      'Time',
      'Type',
      'Day Period',
      'Systolic',
      'Diastolic',
      'Pulse',
      'Glucose Value',
      'Glucose Unit',
      'Meal Context',
      'Note',
    ],
  ];

  const merged = [
    ...bpReadings.map((reading) => ({ kind: 'Blood Pressure' as const, reading })),
    ...sugarReadings.map((reading) => ({ kind: 'Blood Sugar' as const, reading })),
  ].sort(
    (left, right) =>
      new Date(left.reading.timestamp).getTime() - new Date(right.reading.timestamp).getTime(),
  );

  for (const entry of merged) {
    const { date, time } = toDateParts(entry.reading.timestamp);
    const dayPeriod = entry.reading.dayPeriod ?? getDayPeriodFromTimestamp(entry.reading.timestamp);

    if (entry.kind === 'Blood Pressure') {
      rows.push([
        date,
        time,
        entry.kind,
        dayPeriod,
        entry.reading.systolic,
        entry.reading.diastolic,
        entry.reading.pulse ?? '',
        '',
        '',
        '',
        entry.reading.note ?? '',
      ]);
      continue;
    }

    rows.push([
      date,
      time,
      entry.kind,
      dayPeriod,
      '',
      '',
      '',
      entry.reading.value,
      entry.reading.unit,
      entry.reading.mealContext,
      entry.reading.note ?? '',
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function parseTimestamp(dateText: string, timeText: string): string {
  const safeDate = (dateText || '').trim();
  const safeTime = (timeText || '').trim();
  if (!safeDate) return new Date().toISOString();
  const normalized = `${safeDate}T${safeTime || '00:00'}`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export function parseCombinedCsv(csv: string): {
  bpReadings: BPReading[];
  sugarReadings: SugarReading[];
} {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return { bpReadings: [], sugarReadings: [] };
  }

  const bpReadings: BPReading[] = [];
  const sugarReadings: SugarReading[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const [date, time, type, _dayPeriod, systolic, diastolic, pulse, glucoseValue, glucoseUnit, mealContext, note] = cells;
    const timestamp = parseTimestamp(date, time);

    if ((type || '').trim().toLowerCase() === 'blood pressure') {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      if (!Number.isFinite(sys) || !Number.isFinite(dia)) continue;
      const pulseNum = Number(pulse);
      bpReadings.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        systolic: sys,
        diastolic: dia,
        pulse: Number.isFinite(pulseNum) ? pulseNum : undefined,
        note: note?.trim() || undefined,
        timestamp,
        dayPeriod: getDayPeriodFromTimestamp(timestamp),
      });
      continue;
    }

    if ((type || '').trim().toLowerCase() === 'blood sugar') {
      const value = Number(glucoseValue);
      const unit = glucoseUnit === 'mmol/L' ? 'mmol/L' : 'mg/dL';
      const safeMealContext =
        mealContext === 'fasting' ||
        mealContext === 'before-meal' ||
        mealContext === 'after-meal' ||
        mealContext === 'bedtime' ||
        mealContext === 'random'
          ? mealContext
          : 'random';
      if (!Number.isFinite(value)) continue;
      sugarReadings.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        value,
        unit,
        mealContext: safeMealContext,
        note: note?.trim() || undefined,
        timestamp,
        dayPeriod: getDayPeriodFromTimestamp(timestamp),
      });
    }
  }

  return { bpReadings, sugarReadings };
}

export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseBackupJson(content: string): AppBackupData {
  const parsed = JSON.parse(content) as AppBackupData;
  return {
    theme: parsed.theme === 'light' ? 'light' : parsed.theme === 'dark' ? 'dark' : undefined,
    bpReadings: Array.isArray(parsed.bpReadings) ? parsed.bpReadings : [],
    sugarReadings: Array.isArray(parsed.sugarReadings) ? parsed.sugarReadings : [],
    version: parsed.version,
    exportedAt: parsed.exportedAt,
  };
}
