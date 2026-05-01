import { Mic, RotateCcw } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface Props {
  transcript: string;
  isListening: boolean;
  accentClassName: string;
  exampleText: string;
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
}

export function VoiceInputSheet({
  transcript,
  isListening,
  accentClassName,
  exampleText,
  onConfirm,
  onRetake,
  onCancel,
}: Props) {
  const canConfirm = transcript.trim().length > 0;

  return (
    <BottomSheet
      title="Voice Input"
      subtitle={isListening ? 'Listening now. Speak naturally and confirm when ready.' : 'Review the captured text below.'}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accentClassName}`}>
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{isListening ? 'Live transcript' : 'Captured transcript'}</p>
              <p className="text-xs text-slate-500">Example: {exampleText}</p>
            </div>
          </div>
          <div className="min-h-24 rounded-2xl bg-slate-950/60 px-4 py-3 text-base text-slate-100">
            {transcript.trim() || <span className="text-slate-500">Start speaking. Your words will appear here live.</span>}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onRetake} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary flex-1" disabled={!canConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}