import { useEffect, useState } from 'react';
import { Activity, Droplets, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import type { ActiveTab, BPReading, SugarReading } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { BPPage } from './pages/BPPage';
import { SugarPage } from './pages/SugarPage';
import { SettingsPage } from './pages/SettingsPage';
import { bpStorage, sugarStorage } from './utils/storage';
import { LockScreen } from './components/LockScreen';

const TABS: { id: ActiveTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'bp', label: 'Blood Pressure', Icon: Activity },
  { id: 'sugar', label: 'Blood Sugar', Icon: Droplets },
  { id: 'settings', label: 'Settings', Icon: SlidersHorizontal },
];

export default function App() {
  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('heldy_unlocked') !== 'true';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('heldy_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [bpReadings, setBpReadings] = useState<BPReading[]>([]);
  const [sugarReadings, setSugarReadings] = useState<SugarReading[]>([]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setBpReadings(bpStorage.getAll());
      setSugarReadings(sugarStorage.getAll());
    }
  }, [activeTab]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('heldy_theme', theme);
  }, [theme]);

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      {isLocked && (
        <LockScreen
          onUnlock={() => {
            sessionStorage.setItem('heldy_unlocked', 'true');
            setIsLocked(false);
          }}
        />
      )}
      <header className="sticky top-0 z-40 bg-slate-950/75 backdrop-blur-xl border-b border-slate-800/70">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/heldy.png" alt="" className="w-8 h-8 rounded-lg object-cover" aria-hidden="true" />
            <span className="font-bold text-lg text-slate-100 tracking-tight">Heldy</span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Your personal health companion</p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            bpReadings={bpReadings}
            sugarReadings={sugarReadings}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'bp' && <BPPage />}
        {activeTab === 'sugar' && <SugarPage />}
        {activeTab === 'settings' && (
          <SettingsPage
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </main>

      <nav className="sticky bottom-0 z-40 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors duration-150 ${
                activeTab === id
                  ? id === 'sugar'
                    ? 'text-orange-400'
                    : 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  activeTab === id
                    ? id === 'sugar'
                      ? 'text-orange-400'
                      : 'text-blue-400'
                    : 'text-slate-500'
                }`}
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
