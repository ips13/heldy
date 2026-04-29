import { format, parseISO } from 'date-fns';
import type { BPReading, SugarReading } from '../types';
import { getDayPeriodFromTimestamp } from './health';

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
