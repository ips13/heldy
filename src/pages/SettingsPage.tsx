import { useRef, type ChangeEvent } from 'react';
import { Download, Moon, Palette, Sun, Upload, Database, RotateCcw } from 'lucide-react';
import { bpStorage, sugarStorage, applyAppBackupData, getAppBackupData } from '../utils/storage';
import {
  buildCombinedCsv,
  downloadCsv,
  downloadJson,
  parseBackupJson,
  parseCombinedCsv,
} from '../utils/export';

interface Props {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export function SettingsPage({ theme, onThemeChange }: Props) {
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const bpReadings = bpStorage.getAll();
    const sugarReadings = sugarStorage.getAll();
    const csv = buildCombinedCsv(bpReadings, sugarReadings);
    const exportDate = new Date().toISOString().slice(0, 10);
    downloadCsv(`heldy-records-${exportDate}.csv`, csv);
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseCombinedCsv(content);
      if (parsed.bpReadings.length === 0 && parsed.sugarReadings.length === 0) {
        window.alert('No valid records found in this CSV file.');
        return;
      }

      const shouldReplace = window.confirm(
        'Replace existing records with imported data? Click Cancel to append imported records.',
      );

      if (shouldReplace) {
        bpStorage.replaceAll(parsed.bpReadings);
        sugarStorage.replaceAll(parsed.sugarReadings);
      } else {
        bpStorage.replaceAll([...bpStorage.getAll(), ...parsed.bpReadings]);
        sugarStorage.replaceAll([...sugarStorage.getAll(), ...parsed.sugarReadings]);
      }

      window.alert('CSV imported successfully.');
    } catch {
      window.alert('Import failed. Please choose a valid CSV exported from this app.');
    } finally {
      event.target.value = '';
    }
  };

  const handleBackupDownload = () => {
    const backup = getAppBackupData();
    const exportDate = new Date().toISOString().slice(0, 10);
    downloadJson(`heldy-backup-${exportDate}.json`, backup);
  };

  const handleBackupRestore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const backup = parseBackupJson(content);
      const confirmed = window.confirm('Restore full app backup now? This will overwrite existing records.');
      if (!confirmed) return;

      applyAppBackupData(backup);
      if (backup.theme) onThemeChange(backup.theme);
      window.alert('Backup restored successfully.');
    } catch {
      window.alert('Restore failed. Please choose a valid heldy backup JSON file.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Customize your app experience</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-400" />
          Appearance
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`rounded-2xl p-4 border text-left transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/40'
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
          >
            <Moon className="w-5 h-5 mb-2 text-slate-100" />
            <p className="font-semibold text-slate-100">Dark</p>
            <p className="text-xs text-slate-400 mt-1">Low glare for night use</p>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`rounded-2xl p-4 border text-left transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
          >
            <Sun className="w-5 h-5 mb-2 text-amber-500" />
            <p className="font-semibold text-slate-100">Light</p>
            <p className="text-xs text-slate-400 mt-1">Bright daytime layout</p>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-2">About Tracking Time</h3>
        <p className="text-sm text-slate-400">
          New readings auto-capture current timestamp and classify as Morning, Noon, Evening, or Night.
          During edit, you can manually override this period.
        </p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          Export / Import Records
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Download one CSV with all readings, or import CSV back into the app.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary inline-flex items-center gap-2 self-start"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="btn-secondary inline-flex items-center gap-2 self-start"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportCsv}
          />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Full App Backup / Restore
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Create a full backup (theme + all records) or restore from a previous backup file.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleBackupDownload}
            className="btn-primary inline-flex items-center gap-2 self-start"
          >
            <Download className="w-4 h-4" />
            Download Backup
          </button>
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className="btn-secondary inline-flex items-center gap-2 self-start"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Backup
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleBackupRestore}
          />
        </div>
      </div>
    </div>
  );
}
