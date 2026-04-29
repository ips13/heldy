import { Download, Moon, Palette, Sun } from 'lucide-react';
import { bpStorage, sugarStorage } from '../utils/storage';
import { buildCombinedCsv, downloadCsv } from '../utils/export';

interface Props {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export function SettingsPage({ theme, onThemeChange }: Props) {
  const handleExport = () => {
    const bpReadings = bpStorage.getAll();
    const sugarReadings = sugarStorage.getAll();
    const csv = buildCombinedCsv(bpReadings, sugarReadings);
    const exportDate = new Date().toISOString().slice(0, 10);
    downloadCsv(`ihealth-records-${exportDate}.csv`, csv);
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
          Export Records
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Download one CSV file with all blood pressure and sugar readings ordered by date and time,
          ready to share with your doctor.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="btn-primary inline-flex items-center gap-2 self-start"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
