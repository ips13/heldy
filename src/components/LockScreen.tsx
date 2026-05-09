import { useState } from 'react';
import { Delete } from 'lucide-react';

const PASSCODE = '7009';
const DOT_COUNT = 4;

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (input.length >= DOT_COUNT || error) return;
    const next = input + digit;
    setInput(next);

    if (next.length === DOT_COUNT) {
      if (next === PASSCODE) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setInput('');
          setError(false);
          setShake(false);
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    if (error) return;
    setInput((prev) => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-slate-950">
      {/* App logo */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <img src="/heldy.png" alt="Heldy" className="w-20 h-20 rounded-3xl object-cover shadow-2xl" />
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-3xl text-slate-100 tracking-tight">Heldy</span>
          <p className="text-slate-500 text-sm">Enter passcode to continue</p>
        </div>
      </div>

      {/* PIN dots */}
      <div
        className={`flex gap-5 transition-all ${shake ? 'animate-shake' : ''}`}
        style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              error
                ? 'border-red-500 bg-red-500'
                : i < input.length
                ? 'border-blue-400 bg-blue-400'
                : 'border-slate-600 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm -mt-4 animate-pulse">Incorrect passcode</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4">
        {keys.map((key, i) => {
          if (key === '') {
            return <div key={i} />;
          }
          if (key === 'del') {
            return (
              <button
                key={i}
                onPointerDown={() => handleDelete()}
                className="w-20 h-20 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-800 active:bg-slate-700 transition-colors duration-100 select-none"
                aria-label="Delete"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }
          return (
            <button
              key={i}
              onPointerDown={() => handleDigit(key)}
              className="w-20 h-20 rounded-full flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors duration-100 select-none"
            >
              <span className="text-2xl font-light text-slate-100 leading-none">{key}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
          75% { transform: translateX(-5px); }
          90% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
