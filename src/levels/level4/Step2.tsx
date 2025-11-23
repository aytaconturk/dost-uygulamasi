import { useEffect, useMemo, useRef, useState } from 'react';
import { getSchema } from '../../data/schemas';
import Countdown from '../components/Countdown';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

const STORY_ID = 3;

export default function L4Step2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'dost-summary' | 'student-summary'>('intro');
  const [countdownActive, setCountdownActive] = useState(false);
  const { onStepCompleted } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const schema = useMemo(() => getSchema(STORY_ID), []);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

  const playAudio = async (audioPath: string) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        await el.play();
      } catch {}
    }
  };

  const startFlow = async () => {
    setStarted(true);
    await playAudio('/src/assets/audios/level4/level4-step2-intro.mp3');
    setPhase('dost-summary');
  };

  const onDostFinished = () => {
    setPhase('student-summary');
  };

  const onCountdownStart = () => {
    setCountdownActive(true);
  };

  const onCountdownComplete = async () => {
    setCountdownActive(false);
    
    // Mark step as completed
    if (onStepCompleted) {
      await onStepCompleted({
        phase: 'student-summary',
        completed: true
      });
    }
  };

  if (!schema) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Şema bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">2. Adım: Özetleme</h2>
        {!started && (
          <button onClick={startFlow} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
        )}
      </div>

      {started && (
        <div className="bg-white rounded-xl shadow p-8 space-y-6">
          {/* Schema Reference */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Şema Referansı</h3>
            <div className="grid grid-cols-2 gap-4">
              {schema.sections.map((section) => (
                <div key={section.id} className="bg-white p-3 rounded border border-blue-200">
                  <h4 className="font-bold text-blue-700 text-sm mb-2">{section.title}</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {section.items.slice(0, 2).map((item, i) => (
                      <li key={i} className="truncate">• {item}</li>
                    ))}
                    {section.items.length > 2 && <li className="text-gray-500">...</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Phase: DOST Summary */}
          {phase === 'dost-summary' && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
              <p className="text-center text-gray-800 mb-4 font-semibold">
                DOST metni özet yapıyor. Dikkatli dinle!
              </p>
              <button
                onClick={onDostFinished}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                DOST'un özeti bitti, devam et
              </button>
            </div>
          )}

          {/* Phase: Student Summary */}
          {phase === 'student-summary' && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 space-y-4">
              <p className="text-center text-gray-800 font-semibold">
                Şimdi sıra sende. Şemadaki bilgileri sırayla kendi cümlelerinle ifade et.
              </p>

              {!countdownActive ? (
                <Countdown onStart={onCountdownStart} onComplete={onCountdownComplete} duration={180} />
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-green-300 rounded p-4 min-h-24 flex items-center justify-center">
                    <p className="text-gray-500 text-center">
                      Mikrofon kaydı burada gösterilecek...
                    </p>
                  </div>
                  <button
                    onClick={() => setCountdownActive(false)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
                  >
                    Özeti Gönder
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
