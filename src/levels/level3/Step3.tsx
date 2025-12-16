import { useEffect, useMemo, useRef, useState } from 'react';
import { playTts } from '../../lib/playTts';
import { useSelector } from 'react-redux';
import { getStepCompletionData } from '../../lib/supabase';
import { useStepContext } from '../../contexts/StepContext';
import type { RootState } from '../../store/store';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { playSoundEffect } from '../../lib/soundEffects';

export default function L3Step3() {
  const student = useSelector((state: RootState) => state.user.student);
  const { sessionId, storyId } = useStepContext();
  const [result, setResult] = useState<{totalWords:number; elapsedSec:number; wpm:number; targetWPM:number; analysis?: any} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // Load result from Supabase (from Step 2 completion data)
  useEffect(() => {
    if (!student) return;

    const loadResult = async () => {
      try {
        const completionData = await getStepCompletionData(student.id, storyId, 3, 2, sessionId);
        if (completionData && completionData.totalWords !== undefined) {
          setResult(completionData as any);
        }
      } catch (err) {
        console.error('Error loading step completion data:', err);
      }
    };

    loadResult();
  }, [student?.id, storyId, sessionId]);

  const playAudio = async (audioPath: string) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        // @ts-ignore
        el.playsInline = true;
        el.muted = false;
        await el.play();
      } catch (err) {
        console.error('Failed to play audio:', err);
      }
    }
  };

  const playFeedbackAudio = async () => {
    if (!result?.analysis?.audioBase64 || isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    const el = audioRef.current;
    if (!el) {
      setIsPlayingAudio(false);
      return;
    }

    try {
      const base64 = result.analysis.audioBase64;
      const audioSrc = base64.startsWith('data:') ? base64 : `data:audio/mpeg;base64,${base64}`;
      
      el.src = audioSrc;
      el.playbackRate = getPlaybackRate();
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;

      el.onended = () => setIsPlayingAudio(false);
      el.onerror = () => setIsPlayingAudio(false);

      await el.play();
    } catch (err) {
      console.error('Failed to play analysis audio:', err);
      setIsPlayingAudio(false);
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
    
    // Use analysisText from n8n response if available
    if (r.analysis?.analysisText) {
      return r.analysis.analysisText;
    }
    
    // Fallback to old logic
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
      playSoundEffect('success');
    } else {
      playAudio('/src/assets/audios/level3/seviye-3-adim-3-uzgunum.mp3');
      playSoundEffect('error');
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
        onClick={result?.analysis?.audioBase64 ? playFeedbackAudio : playFeedbackTts}
        className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg hover:bg-purple-50 transition duration-200"
      >
        <p className="text-lg text-gray-800">{summaryText}</p>
        <p className="text-sm text-purple-600 mt-3 font-semibold">
          💬 Tıkla - DOST'u dinle {isPlayingAudio && '(Çalıyor...)'}
        </p>
      </div>
      
      {result?.analysis?.metrics && (
        <div className="bg-white rounded-xl shadow p-5 mt-4">
          <h3 className="text-lg font-bold text-purple-800 mb-3">📊 Detaylı Metrikler</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-semibold">Süre:</span> {result.analysis.metrics.durationMMSS}</div>
            <div><span className="font-semibold">Hedef Kelime:</span> {result.analysis.metrics.targetWordCount}</div>
            <div><span className="font-semibold">Okunan Kelime:</span> {result.analysis.metrics.spokenWordCount}</div>
            <div><span className="font-semibold">Doğru Kelime:</span> {result.analysis.metrics.matchedWordCount}</div>
            <div><span className="font-semibold">Doğruluk:</span> {result.analysis.metrics.accuracyPercent}%</div>
            <div><span className="font-semibold">WPM (Okunan):</span> {result.analysis.metrics.wpmSpoken}</div>
            <div><span className="font-semibold">WPM (Doğru):</span> {result.analysis.metrics.wpmCorrect}</div>
            <div><span className="font-semibold">WPM (Hedef):</span> {result.analysis.metrics.wpmTarget}</div>
          </div>
        </div>
      )}
    </div>
  );
}
