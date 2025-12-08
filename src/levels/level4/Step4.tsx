import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

const completionText = 'Dolu şema üzerinden beyin fırtınası yapma ve yorumda bulunma, özetleme ve okuduğunu anlama soruları görevlerini gerçekleştirerek 4. Seviyemizi tamamladık seni tebrik ediyorum.';

export default function Step4() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const { onStepCompleted } = useStepContext();
  const completionAudio = '/audios/level4/seviye-4-tamamlandi.mp3';
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  useEffect(() => {
    const el = audioRef.current;
    const playAudio = async () => {
      if (el) {
        try {
          el.src = completionAudio;
          // Apply playback rate
          el.playbackRate = getPlaybackRate();
          // @ts-ignore
          el.playsInline = true; 
          el.muted = false;
          await el.play();
        } catch (err) {
          console.error('Error playing completion audio:', err);
          // Text-to-speech removed as requested
        }
      }
    };

    playAudio();

    // Mark step as completed
    if (onStepCompleted) {
      onStepCompleted({
        level: 4,
        completed: true
      });
    }

    const stopAll = () => { try { audioRef.current?.pause(); } catch {} };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } } catch {}
    };
  }, [onStepCompleted]);

  const confettiPieces = useMemo(() => {
    const lefts = [2,8,14,20,26,32,38,44,50,56,62,68,74,80,86,92];
    const durations = ['confetti-dur-3','confetti-dur-4','confetti-dur-5','confetti-dur-6'];
    const delays = ['confetti-delay-0','confetti-delay-2','confetti-delay-4','confetti-delay-6','confetti-delay-8'];
    const colors = ['bg-red-500','bg-yellow-400','bg-green-500','bg-blue-500','bg-pink-500','bg-purple-500'];
    const arr: { cls: string }[] = [];
    for (let i = 0; i < 64; i++) {
      const l = lefts[i % lefts.length];
      const c = colors[i % colors.length];
      const d = durations[i % durations.length];
      const de = delays[i % delays.length];
      arr.push({ cls: `confetti-piece confetti-l-${l} ${c} ${d} ${de}` });
    }
    return arr;
  }, []);

  return (
    <div className="relative">
      <audio ref={audioRef} preload="auto" />
      <div className="absolute inset-0 confetti pointer-events-none" aria-hidden>
        {confettiPieces.map((p, i) => (
          <div key={i} className={p.cls}></div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center text-center bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto mt-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-extrabold text-purple-800 mb-2">Tebrikler!</h3>
        <p className="text-lg text-gray-700 mb-1">4. Seviye başarıyla tamamlandı.</p>
        <p className="text-base text-gray-600 max-w-2xl">{completionText}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/')} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold">Ana Sayfaya Dön</button>
        </div>
      </div>
    </div>
  );
}
