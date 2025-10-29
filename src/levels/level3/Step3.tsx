import { useEffect, useMemo, useRef, useState } from 'react';
import { playTts } from '../../lib/playTts';

export default function L3Step3() {
  const [result, setResult] = useState<{totalWords:number; elapsedSec:number; wpm:number; targetWPM:number} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('level3_result');
      if (raw) setResult(JSON.parse(raw));
    } catch {}
  }, []);

  const playAudio = async (audioPath: string) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        // @ts-ignore
        el.playsInline = true;
        el.muted = false;
        await el.play();
      } catch (err) {
        console.error('Failed to play audio:', err);
      }
    }
  };

  const playFeedbackTts = async () => {
    if (!result) return;
    try {
      const feedbackText = `Şimdi hedefimize ulaşıp ulaşamadığımızı kontrol etme zamanı. Metni üçüncü kez okuduğunda okuma hızın ${result.wpm} sözcük. Okuma hedefi olarak ${result.targetWPM} sözcük seçmiştin.`;
      await playTts(feedbackText);
    } catch (err) {
      console.error('TTS playback error:', err);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const summaryText = useMemo(() => {
    const r = result;
    if (!r) return 'Henüz bir okuma sonucu bulunamadı.';
    const base = `Şimdi hedefimize ulaşıp ulaşamadığımızı kontrol etme zamanı. Metni üçüncü kez okuduğunda okuma hızın ${r.wpm} sözcük/dakika. Okuma hedefi olarak ${r.targetWPM} sözcük/dakika seçmiştin.`;
    if (r.wpm >= r.targetWPM) {
      return base + ' Tebrikler belirlemiş olduğun hedefe ulaştın. Ödülü hak ettin. Çalışma sonunda sana sunulan ödüllerden birini tercih edebilirsin.';
    }
    return base + ' Üzgünüm belirlemiş olduğun hedefe ulaşamadın. Ama pes etmek yok; bir sonraki çalışmamızda başarabileceğine inanıyorum. Daha dikkatli ve güzel okumaya çalışırsan başarabilirsin.';
  }, [result]);

  useEffect(() => {
    if (!result || showFeedback) return;

    if (result.wpm >= result.targetWPM) {
      playAudio('/src/assets/audios/level3/seviye-3-adim-3-tebrikler.mp3');
    } else {
      playAudio('/src/assets/audios/level3/seviye-3-adim-3-uzgunum.mp3');
    }
    setShowFeedback(true);
  }, [result, showFeedback]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">3. Adım: Okuma hızı ve Performans geribildirimi</h2>
      </div>
      <div
        onClick={playFeedbackTts}
        className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg hover:bg-purple-50 transition duration-200"
      >
        <p className="text-lg text-gray-800">{summaryText}</p>
        <p className="text-sm text-purple-600 mt-3 font-semibold">💬 Tıkla - DOST'u dinle</p>
      </div>
    </div>
  );
}
