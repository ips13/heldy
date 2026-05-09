import { useRef, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';

const THRESHOLD = 60;
const REVEAL = 80;

interface Props {
  children: React.ReactNode;
  onDeleteRequest: () => void;
  onCopyRequest: () => void;
}

export function SwipeableRow({ children, onDeleteRequest, onCopyRequest }: Props) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const curOffset = useRef(0);
  const dirLocked = useRef<'h' | 'v' | null>(null);
  const snapped = useRef<'copy' | 'delete' | null>(null);

  const setOff = (v: number) => {
    curOffset.current = v;
    setOffset(v);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dirLocked.current = null;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!dirLocked.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      dirLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (dirLocked.current !== 'h') return;
    e.preventDefault();

    const base =
      snapped.current === 'delete' ? -REVEAL :
      snapped.current === 'copy'   ?  REVEAL : 0;

    setOff(Math.max(-REVEAL, Math.min(REVEAL, base + dx)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    const cur = curOffset.current;

    if (Math.abs(cur) < THRESHOLD) {
      snapped.current = null;
      setOff(0);
    } else if (cur < 0) {
      snapped.current = 'delete';
      setOff(-REVEAL);
    } else {
      snapped.current = 'copy';
      setOff(REVEAL);
    }
  };

  const dismiss = () => {
    snapped.current = null;
    setOff(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-800/50">
      {/* Copy panel — left side, revealed by right swipe */}
      <button
        type="button"
        className={`absolute inset-y-0 left-0 flex flex-col items-center justify-center gap-1 bg-emerald-600 active:bg-emerald-700 ${
          snapped.current === 'copy' ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ width: REVEAL }}
        onClick={() => { dismiss(); onCopyRequest(); }}
        tabIndex={-1}
      >
        <Copy className="w-5 h-5 text-white" />
        <span className="text-[11px] text-white font-semibold leading-none">Copy</span>
      </button>

      {/* Delete panel — right side, revealed by left swipe */}
      <button
        type="button"
        className={`absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-red-600 active:bg-red-700 ${
          snapped.current === 'delete' ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ width: REVEAL, top: 1 }}
        onClick={() => { dismiss(); onDeleteRequest(); }}
        tabIndex={-1}
      >
        <Trash2 className="w-5 h-5 text-white" />
        <span className="text-[11px] text-white font-semibold leading-none">Delete</span>
      </button>

      {/* Sliding content */}
      <div
        style={{
          touchAction: 'pan-y',
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 220ms ease-out',
          willChange: 'transform',
          background: 'black',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={snapped.current ? dismiss : undefined}
      >
        {children}
      </div>
    </div>
  );
}
