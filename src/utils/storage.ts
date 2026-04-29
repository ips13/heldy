import type { BPReading, SugarReading } from '../types';

const BP_KEY = 'ihealth_bp_readings';
const SUGAR_KEY = 'ihealth_sugar_readings';

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Blood Pressure ────────────────────────────────────────────────────────────

export const bpStorage = {
  getAll(): BPReading[] {
    return load<BPReading>(BP_KEY).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  add(reading: BPReading): void {
    const all = load<BPReading>(BP_KEY);
    save(BP_KEY, [...all, reading]);
  },

  update(updated: BPReading): void {
    const all = load<BPReading>(BP_KEY).map((r) =>
      r.id === updated.id ? updated : r,
    );
    save(BP_KEY, all);
  },

  remove(id: string): void {
    const all = load<BPReading>(BP_KEY).filter((r) => r.id !== id);
    save(BP_KEY, all);
  },
};

// ── Blood Sugar ───────────────────────────────────────────────────────────────

export const sugarStorage = {
  getAll(): SugarReading[] {
    return load<SugarReading>(SUGAR_KEY).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  add(reading: SugarReading): void {
    const all = load<SugarReading>(SUGAR_KEY);
    save(SUGAR_KEY, [...all, reading]);
  },

  update(updated: SugarReading): void {
    const all = load<SugarReading>(SUGAR_KEY).map((r) =>
      r.id === updated.id ? updated : r,
    );
    save(SUGAR_KEY, all);
  },

  remove(id: string): void {
    const all = load<SugarReading>(SUGAR_KEY).filter((r) => r.id !== id);
    save(SUGAR_KEY, all);
  },
};
