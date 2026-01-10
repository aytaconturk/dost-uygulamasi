import { useEffect, useRef, useState } from 'react';
import { TestTube } from 'lucide-react';
import { getAssetUrl } from '../../lib/image-utils';

export type CountdownProps = {
  onStart: () => void;
  onComplete: () => void;
  duration?: number;
};

export default function Countdown({ onStart, onComplete, duration = 180 }: CountdownProps) {
  const [counting, setCounting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [testAudioActive, setTestAudioActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Test audio aktif mi kontrol et
  useEffect(() => {
    const checkTestAudio = () => {
      const globalEnabled = localStorage.getItem('use_test_audio_global') === 'true';
      setTestAudioActive(globalEnabled);
    };

    checkTestAudio();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'use_test_audio_global') {
        checkTestAudio();
      }
    };

    const handleCustomEvent = () => {
      checkTestAudio();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('testAudioChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testAudioChanged', handleCustomEvent);
    };
  }, []);

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
    const audioPath = getAssetUrl('audios/level4/level4-step2-start.mp3');
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
        <div className="flex flex-col items-center gap-3">
          {testAudioActive && (
            <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              <span>🧪 Test modu: Hazır ses kullanılacak</span>
            </div>
          )}
          
          <button
            onClick={startCountdown}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Başla
          </button>
        </div>
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
