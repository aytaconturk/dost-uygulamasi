import { useEffect, useMemo, useRef } from 'react';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

export default function L3Step4() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { onStepCompleted } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  useEffect(() => {
    const el = audioRef.current;
    const completionText = '3. seviyeyi tamamladın, tebrikler!';
    const speak = () => {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(completionText);
        u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1; window.speechSynthesis.speak(u);
      }
    };
    if (el) {
      try { el.src = '/src/assets/audios/level3/seviye-3-tamamlandi.mp3'; /* optional */
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        // @ts-ignore
        el.playsInline = true; el.muted = false; el.play().catch(speak); } catch { speak(); }
    } else { speak(); }
    
    // Mark step as completed
    if (onStepCompleted) {
      onStepCompleted({
        level: 3,
        completed: true
      });
    }
  }, [onStepCompleted]);

  const confettiPieces = useMemo(() => {
    const positions = [0,2,5,8,10,14,20,26,32,38,44,50,56,62,68,74,80,86,92,95];
    const durations = ['confetti-dur-3','confetti-dur-4','confetti-dur-5','confetti-dur-6'];
    const delays = ['confetti-delay-0','confetti-delay-2','confetti-delay-4','confetti-delay-6','confetti-delay-8'];
    const colors = ['bg-red-500','bg-yellow-400','bg-green-500','bg-blue-500','bg-pink-500','bg-purple-500'];
    return Array.from({length: 72}).map((_,i)=>({ cls: `confetti-piece confetti-l-${positions[i%positions.length]} ${colors[i%colors.length]} ${durations[i%durations.length]} ${delays[i%delays.length]}` }));
  }, []);

  return (
    <div className="relative">
      <audio ref={audioRef} preload="auto" />
      <div className="absolute inset-0 confetti pointer-events-none" aria-hidden>
        {confettiPieces.map((p,i)=>(<div key={i} className={p.cls}></div>))}
      </div>
      <div className="flex flex-col items-center justify-center text-center bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto mt-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-extrabold text-purple-800 mb-2">Tebrikler!</h3>
        <p className="text-lg text-gray-700 mb-1">3. Seviye başarıyla tamamlandı.</p>
      </div>
    </div>
  );
}
