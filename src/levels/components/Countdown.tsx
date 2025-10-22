import { useEffect, useRef, useState } from 'react';

export type CountdownProps = {
  onStart: () => void;
  onComplete: () => void;
  duration?: number;
};

export default function Countdown({ onStart, onComplete, duration = 180 }: CountdownProps) {
  const [counting, setCounting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!counting) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCounting(false);
          onComplete();
          return duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [counting, duration, onComplete]);

  const startCountdown = async () => {
    const audioPath = '/src/assets/audios/level4/level4-step2-start.mp3';
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        await el.play();
      } catch {}
    }
    
    setCounting(true);
    setTimeLeft(duration);
    onStart();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center">
      <audio ref={audioRef} preload="auto" />
      
      {!counting ? (
        <button
          onClick={startCountdown}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
        >
          Başla
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl font-bold text-purple-600 tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setCounting(false)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold"
          >
            Bitir
          </button>
        </div>
      )}
    </div>
  );
}
