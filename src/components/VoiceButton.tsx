import { Mic, MicOff } from 'lucide-react';

interface Props {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceButton({ isListening, isSupported, onStart, onStop }: Props) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      className={`btn-icon ${isListening ? 'bg-red-600 hover:bg-red-500 animate-pulse' : ''}`}
      title={isListening ? 'Stop recording' : 'Speak value'}
    >
      {isListening ? (
        <MicOff className="w-5 h-5 text-white" />
      ) : (
        <Mic className="w-5 h-5 text-slate-300" />
      )}
    </button>
  );
}
