// ── Blood Pressure ───────────────────────────────────────────────────────────

export interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  note?: string;
  timestamp: string; // ISO-8601
  dayPeriod?: DayPeriod;
}

export type BPCategory =
  | 'normal'
  | 'elevated'
  | 'high-1'
  | 'high-2'
  | 'hypertensive-crisis'
  | 'low';

// ── Blood Sugar ───────────────────────────────────────────────────────────────

export type MealContext = 'fasting' | 'before-meal' | 'after-meal' | 'bedtime' | 'random';
export type SugarUnit = 'mg/dL' | 'mmol/L';

export interface SugarReading {
  id: string;
  value: number;
  unit: SugarUnit;
  mealContext: MealContext;
  note?: string;
  timestamp: string; // ISO-8601
  dayPeriod?: DayPeriod;
}

export type SugarCategory = 'low' | 'normal' | 'pre-diabetic' | 'diabetic';

// ── Shared ────────────────────────────────────────────────────────────────────

export type PeriodFilter = '7d' | '14d' | '30d' | '90d' | 'all';

export type DayPeriod = 'morning' | 'noon' | 'evening' | 'night';

export type ActiveTab = 'dashboard' | 'bp' | 'sugar' | 'settings';
