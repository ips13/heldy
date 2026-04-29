import { format, subDays, parseISO, isAfter } from 'date-fns';
import type {
  BPCategory,
  DayPeriod,
  SugarCategory,
  PeriodFilter,
} from '../types';

// ── ID generator ──────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

export function filterByPeriod<T extends { timestamp: string }>(
  items: T[],
  period: PeriodFilter,
): T[] {
  if (period === 'all') return items;
  const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 90;
  const cutoff = subDays(new Date(), days);
  return items.filter((r) => isAfter(parseISO(r.timestamp), cutoff));
}

export function getDayPeriod(date: Date): DayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 20) return 'evening';
  return 'night';
}

export function getDayPeriodFromTimestamp(iso: string): DayPeriod {
  return getDayPeriod(parseISO(iso));
}

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
};

// ── BP classification (AHA 2017) ──────────────────────────────────────────────

export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic > 180 || diastolic > 120) return 'hypertensive-crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high-2';
  if (systolic >= 130 || diastolic >= 80) return 'high-1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  if (systolic < 90 || diastolic < 60) return 'low';
  return 'normal';
}

export const BP_CATEGORY_LABELS: Record<BPCategory, string> = {
  normal: 'Normal',
  elevated: 'Elevated',
  'high-1': 'High Stage 1',
  'high-2': 'High Stage 2',
  'hypertensive-crisis': 'Crisis — Seek Help',
  low: 'Low (Hypotension)',
};

export const BP_CATEGORY_BADGE: Record<BPCategory, string> = {
  normal: 'badge-ok',
  elevated: 'badge-warn',
  'high-1': 'badge-warn',
  'high-2': 'badge-high',
  'hypertensive-crisis': 'badge-high',
  low: 'badge-low',
};

// ── Sugar classification (ADA guidelines, mg/dL) ─────────────────────────────

export function mgdlToMmol(value: number): number {
  return parseFloat((value / 18.0182).toFixed(1));
}

export function mmolToMgdl(value: number): number {
  return Math.round(value * 18.0182);
}

/** Classify fasting blood glucose in mg/dL */
export function classifySugar(value: number, unit: 'mg/dL' | 'mmol/L'): SugarCategory {
  const mgdl = unit === 'mmol/L' ? mmolToMgdl(value) : value;
  if (mgdl < 70) return 'low';
  if (mgdl <= 99) return 'normal';
  if (mgdl <= 125) return 'pre-diabetic';
  return 'diabetic';
}

export const SUGAR_CATEGORY_LABELS: Record<SugarCategory, string> = {
  low: 'Low (Hypoglycemia)',
  normal: 'Normal',
  'pre-diabetic': 'Pre-diabetic',
  diabetic: 'High (Diabetic Range)',
};

export const SUGAR_CATEGORY_BADGE: Record<SugarCategory, string> = {
  low: 'badge-low',
  normal: 'badge-ok',
  'pre-diabetic': 'badge-warn',
  diabetic: 'badge-high',
};
