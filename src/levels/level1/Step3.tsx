import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase, getApiEnv } from '../../lib/api';
import { getUser } from '../../lib/user';
import VoiceRecorder from '../../components/VoiceRecorder';
import {
  getParagraphs,
  paragraphToPlain,
  getFirstThreeParagraphFirstSentences,
  type Paragraph,
} from '../../data/stories';

export default function Step3() {
  const story = {
    id: 1,
    title: 'Büyük İşler Küçük Dostlar',
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro' | 'dost' | 'student'>( 'intro' );
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-3-fable.mp3';

  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const firstSentences = useMemo(() => getFirstThreeParagraphFirstSentences(story.id), [story.id]);

  // helpers to compute first sentence length per paragraph
  const firstSentenceLengths = useMemo(() => {
    return paragraphs.map((p, idx) => {
      const plain = paragraphToPlain(p);
      if (idx < 3) {
        const fs = firstSentences[idx] || '';
        return fs.length;
      }
      // compute generically
      const match = plain.match(/[^.!?\n]+[.!?]?/);
      return match ? match[0].trim().length : 0;
    });
  }, [paragraphs, firstSentences]);

  useEffect(() => {
    const el = audioRef.current;
    const startDostFlow = () => {
      setPhase('dost');
      runDostAnalysis();
    };
    if (el) {
      el.src = stepAudio;
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;
      el.play()
        .then(() => {
          el.addEventListener('ended', startDostFlow, { once: true });
        })
        .catch(() => startDostFlow());
    } else {
      startDostFlow();
    }
    const stopAll = () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {}
      }
    };
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'tr-TR';
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.onend = () => setPhase('student');
      utter.onerror = () => setPhase('student');
      speechSynthesis.speak(utter);
    } else {
      setPhase('student');
    }
  };

  const playAudioFromBase64 = async (base64: string) => {
    if (!audioRef.current || !base64) throw new Error('no audio');
    const tryMime = async (mime: string) => {
      const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
      audioRef.current!.src = src;
      await audioRef.current!.play();
      await new Promise<void>((resolve) => {
        audioRef.current!.addEventListener('ended', () => resolve(), { once: true });
      });
    };
    try {
      await tryMime('audio/mpeg');
    } catch {
      try { await tryMime('audio/webm;codecs=opus'); } catch { await tryMime('audio/wav'); }
    }
  };

  const runDostAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const u = getUser();
      const { data } = await axios.post(
        `${getApiBase()}/dost/level1/step3`,
        { title: story.title, firstSentences, step: 3, userId: u?.userId || '' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const text = data.answer || data.message || data.text || data.response || '';
      setAnalysisText(text);
      const audioBase64: string | undefined = data?.audioBase64;
      if (audioBase64 && audioBase64.length > 100) {
        try {
          await playAudioFromBase64(audioBase64);
          setPhase('student');
        } catch {
          speakText(text || 'Metnin ilk cümlelerinden yola çıkarak tahminde bulundum.');
        }
      } else {
        speakText(text || 'Metnin ilk cümlelerinden yola çıkarak tahminde bulundum.');
      }
    } catch (e) {
      const fallback = 'Metnin ilk cümlelerinden yola çıkarak, karıncaların yaşamı, yapısı ve beslenmesi hakkında bilgi verildiğini tahmin ediyorum.';
      setAnalysisText(fallback);
      speakText(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderParagraph = (p: Paragraph, idx: number) => {
    // Determine phase-specific highlighting (first 3 for DOST, others for STUDENT)
    const shouldHighlight = (phase === 'dost' && idx < 3) || (phase === 'student' && idx >= 3);

    // Find the first bold-starting sentence => first bold segment (data structured as sentence-length bold segments)
    const firstBoldIdx = p.findIndex(seg => seg.bold);

    const parts: JSX.Element[] = [];
    p.forEach((seg, i) => {
      const base = seg.bold ? 'font-bold' : undefined;
      if (shouldHighlight && i === firstBoldIdx) {
        parts.push(
          <span key={i} className={`rounded px-1 bg-yellow-300 ${base || ''}`}>{seg.text}</span>
        );
      } else {
        parts.push(<span key={i} className={base}>{seg.text}</span>);
      }
    });
    return <p key={idx} className="mt-3 leading-relaxed text-gray-800">{parts}</p>;
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const file = new File([audioBlob], 'cocuk_sesi.mp3', { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('ses', file);
      formData.append('kullanici_id', '12345');
      formData.append('hikaye_adi', story.title);
      formData.append('adim', '3');
      formData.append('adim_tipi', 'cumle_tahmini');
      const { data } = await axios.post(`${getApiBase()}/dost/level1/children-voice`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const responseText = data.message || data.text || data.response || 'Teşekkürler! Tahminlerini dinledim.';
      setChildrenVoiceResponse(responseText);
      // speak with TTS as we don't have your final audio yet
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Harika! Şimdi diğer paragrafların ilk cümlelerini sen oku ve tahminlerini söyle.');
        u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1; window.speechSynthesis.speak(u);
      }
    } catch (e) {
      const fallback = 'Çok iyi! Tahminlerin mantıklı görünüyor.';
      setChildrenVoiceResponse(fallback);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-4">3. Adım: Anlama Çalışması</h2>

      <div className="mb-4">
        <img src={'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png'} alt={story.title} className="w-full max-w-xs mx-auto rounded-xl shadow" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {isAnalyzing && phase === 'dost' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">DOST metnin ilk cümlelerini okuyor ve tahmin ediyor...</div>
        )}
        <div className="text-lg">
          {paragraphs.map((p, idx) => renderParagraph(p, idx))}
        </div>

        {phase === 'student' && !childrenVoiceResponse && (
          <div className="mt-6 text-center">
            <p className="mb-4 text-xl font-bold text-green-700">Hadi sıra sende! Mikrofona konuş</p>
            <VoiceRecorder onSave={handleVoiceSubmit} onPlayStart={() => { try { window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any)); } catch {} }} />
            {isProcessingVoice && (
              <p className="mt-2 text-blue-600 font-medium">DOST senin sözlerini değerlendiriyor...</p>
            )}
          </div>
        )}

        {childrenVoiceResponse && (
          <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">🗣️ DOST'un Yorumu:</h3>
            <p className="text-green-700 text-lg">{childrenVoiceResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}
