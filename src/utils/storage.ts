import type { BPReading, SugarReading } from '../types';

const BP_KEY = 'heldy_bp_readings';
const SUGAR_KEY = 'heldy_sugar_readings';

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

  replaceAll(readings: BPReading[]): void {
    save(BP_KEY, readings);
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

  replaceAll(readings: SugarReading[]): void {
    save(SUGAR_KEY, readings);
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

export interface AppBackupData {
  theme?: 'dark' | 'light';
  lockEnabled?: boolean;
  bpReadings: BPReading[];
  sugarReadings: SugarReading[];
  version?: string;
  exportedAt?: string;
}

export function getAppBackupData(): AppBackupData {
  return {
    theme: localStorage.getItem('heldy_theme') === 'light' ? 'light' : 'dark',
    lockEnabled: localStorage.getItem('heldy_lock_enabled') !== 'false',
    bpReadings: bpStorage.getAll(),
    sugarReadings: sugarStorage.getAll(),
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
}

export function applyAppBackupData(data: AppBackupData): void {
  bpStorage.replaceAll(data.bpReadings ?? []);
  sugarStorage.replaceAll(data.sugarReadings ?? []);
  if (data.theme) {
    localStorage.setItem('heldy_theme', data.theme);
  }
  if (data.lockEnabled !== undefined) {
    localStorage.setItem('heldy_lock_enabled', data.lockEnabled ? 'true' : 'false');
  }
}
