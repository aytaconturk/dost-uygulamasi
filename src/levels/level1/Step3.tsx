import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase, getApiEnv } from '../../lib/api';
import { getUser } from '../../lib/user';
import VoiceRecorder from '../../components/VoiceRecorder';
import { submitChildrenVoice, type Level1ChildrenVoiceResponse } from '../../lib/level1-api';
import {
  getParagraphs,
  paragraphToPlain,
  getFirstThreeParagraphFirstSentences,
  getFirstSentence,
  type Paragraph,
} from '../../data/stories';
import { useStepContext } from '../../contexts/StepContext';
import { getStoryById } from '../../lib/supabase';
import { getStoryImageUrl } from '../../lib/image-utils';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getPlaybackRate } from '../../components/SidebarSettings';

export default function Step3() {
  const [story, setStory] = useState<{ id: number; title: string; image: string } | null>(null);
  const { sessionId, storyId } = useStepContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false); // Sadece bir kez başlatmak için flag
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // Load story data from Supabase
  useEffect(() => {
    const loadStory = async () => {
      try {
        const { data, error } = await getStoryById(storyId);
        if (error || !data) {
          // Fallback to default story - use local image path
          setStory({
            id: storyId,
            title: `Oturum ${storyId}`,
            image: `/images/story${storyId}.png`,
          });
        } else {
          // Use image from Supabase if available, otherwise use local path
          const imagePath = data.image || `/images/story${storyId}.png`;
          setStory({
            id: data.id,
            title: data.title,
            image: imagePath,
          });
        }
      } catch (e) {
        // Fallback to default story - use local image path
        setStory({
          id: storyId,
          title: `Oturum ${storyId}`,
          image: `/images/story${storyId}.png`,
        });
      }
    };
    loadStory();
  }, [storyId]);

  const [phase, setPhase] = useState<'intro' | 'dost' | 'student'>( 'intro' );
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [firstSentences, setFirstSentences] = useState<string[]>([]);
  const [resumeUrl, setResumeUrl] = useState<string>('');

  const stepAudio = '/audios/level1/seviye-1-adim-3-fable.mp3';

  const paragraphs = useMemo(() => story ? getParagraphs(story.id) : [], [story?.id]);

  useEffect(() => {
    if (story) {
      getFirstThreeParagraphFirstSentences(story.id).then((sentences) => {
        console.log('📝 getFirstThreeParagraphFirstSentences sonucu:', sentences);
        setFirstSentences(sentences);
      });
    }
  }, [story?.id]);

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
    console.log('🔄 Step3 useEffect çalıştı:', { 
      hasStarted: hasStartedRef.current, 
      hasStory: !!story, 
      firstSentencesLength: firstSentences.length 
    });
    
    // Eğer zaten başlatılmışsa, tekrar çalıştırma
    if (hasStartedRef.current) {
      console.log('⏭️ Zaten başlatılmış, atlanıyor');
      return;
    }
    
    // Story ve firstSentences yüklenene kadar bekle
    if (!story || firstSentences.length === 0) {
      console.log('⏳ Bekleniyor... story:', !!story, 'firstSentences:', firstSentences.length);
      return;
    }
    
    // Flag'i işaretle - artık tekrar çalışmayacak
    hasStartedRef.current = true;
    console.log('✅ Step3 başlatılıyor!', { 
      story: story.title, 
      firstSentencesCount: firstSentences.length,
      firstSentences: firstSentences
    });
    
    const startDostFlow = () => {
      console.log('🎬 DOST analysis başlıyor...');
      setPhase('dost');
      runDostAnalysis();
    };
    
    // Audio element'in mount olması için kısa bir gecikme
    console.log('⏱️ setTimeout başlatılıyor (200ms)...');
    const timeoutId = setTimeout(() => {
      console.log('⏱️ setTimeout tamamlandı, audio kontrol ediliyor...');
      const el = audioRef.current;
      console.log('🔍 audioRef.current:', el ? 'VAR' : 'YOK');
      
      if (el) {
        console.log('🎵 Step3 intro audio yükleniyor:', stepAudio);
        el.src = stepAudio;
        // @ts-ignore
        el.playsInline = true;
        el.muted = false;
        el.playbackRate = getPlaybackRate();
        
        const handleCanPlay = () => {
          console.log('✅ Step3 audio hazır, oynatılıyor...');
          el.play()
            .then(() => {
              console.log('✅ Step3 audio oynatılıyor');
              el.addEventListener('ended', () => {
                console.log('✅ Step3 audio bitti, DOST analysis başlıyor');
                startDostFlow();
              }, { once: true });
            })
            .catch((err) => {
              console.warn('⚠️ Step3 audio oynatılamadı:', err);
              startDostFlow();
            });
        };
        
        const handleError = (e: Event) => {
          console.error('❌ Step3 audio yüklenemedi:', e);
          startDostFlow();
        };
        
        el.addEventListener('canplay', handleCanPlay, { once: true });
        el.addEventListener('error', handleError, { once: true });
        
        // If already loaded, play immediately
        if (el.readyState >= 2) {
          console.log('✅ Step3 audio zaten yüklü');
          handleCanPlay();
        } else {
          el.load();
        }
      } else {
        console.log('⚠️ Audio element bulunamadı, direkt DOST analysis başlıyor');
        startDostFlow();
      }
    }, 200); // 100ms'den 200ms'e çıkarıldı
    
    const stopAll = () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    
    return () => {
      // Eğer başlatılmışsa cleanup yapma (timeout iptal etme)
      if (hasStartedRef.current) {
        console.log('🛑 Cleanup atlandı (zaten başlatılmış)');
        window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
        return;
      }
      
      console.log('🧹 Cleanup yapılıyor (henüz başlatılmamış)');
      clearTimeout(timeoutId);
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {}
      }
    };
  }, [story, firstSentences]); // Dependency array eklendi!

  // Text-to-speech removed - only use mp3 files or API base64 audio

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
    if (!story) return;
    
    // firstSentences yüklenmemişse bekle
    if (firstSentences.length === 0) {
      console.log('⏳ firstSentences henüz hazır değil, bekleniyor...');
      return;
    }
    
    // Eğer zaten analiz edilmişse tekrar çalıştırma
    if (analysisText) {
      console.log('⏭️ Analysis zaten yapılmış, atlanıyor');
      return;
    }
    
    setIsAnalyzing(true);
    console.log('🔍 DOST analysis API çağrısı yapılıyor...', {
      story: story.title,
      firstSentencesCount: firstSentences.length,
      firstSentences: firstSentences
    });
    
    try {
      const u = getUser();
      // ⚠️ n8n workflow "userId" alanını bekliyor
      // Değer olarak sessionId gönderiliyor (her session için unique)
      // Bu sayede aynı kullanıcının farklı hikayeleri karışmaz
      const { data } = await axios.post(
        `${getApiBase()}/dost/level1/step3`,
        { title: story.title, firstSentences, step: 3, userId: sessionId || `anon-${Date.now()}` },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('✅ DOST analysis yanıtı alındı:', data);
      
      const text = data.answer || data.message || data.text || data.response || '';
      setAnalysisText(text);
      setResumeUrl(data.resumeUrl || '');
      
      const audioBase64: string | undefined = data?.audioBase64;
      if (audioBase64 && audioBase64.length > 100) {
        try {
          await playAudioFromBase64(audioBase64);
          setPhase('student');
        } catch {
          // If audio fails, just set phase to student (no text-to-speech)
          setPhase('student');
        }
      } else {
        // No audio available, just set phase to student (no text-to-speech)
        setPhase('student');
      }
    } catch (e) {
      console.error('❌ DOST analysis hatası:', e);
      const fallback = 'Metnin ilk cümlelerinden yola çıkarak, karıncaların yaşamı, yapısı ve beslenmesi hakkında bilgi verildiğini tahmin ediyorum.';
      setAnalysisText(fallback);
      setPhase('student');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderParagraph = (p: Paragraph, idx: number) => {
    // Determine phase-specific highlighting (first 3 for DOST, others for STUDENT)
    const shouldHighlight = (phase === 'dost' && idx < 3) || (phase === 'student' && idx >= 3);

    // İlk 3 paragraf için firstSentences kullan, diğerleri için dinamik hesapla
    let targetText: string | null = null;
    if (idx < 3) {
      targetText = firstSentences[idx] || null;
    } else if (phase === 'student') {
      // idx >= 3 için paragrafın ilk cümlesini hesapla
      const plainText = paragraphToPlain(p);
      targetText = getFirstSentence(plainText);
    }
    
    if (idx < 5) {
      console.log(`🎨 Paragraf ${idx} highlight:`, {
        phase,
        shouldHighlight,
        targetText,
        paragraphText: paragraphToPlain(p).substring(0, 100)
      });
    }
    
    // Paragrafın düz metnini al
    const fullText = paragraphToPlain(p);
    
    // targetText yoksa veya highlight yapılmayacaksa, normal render
    if (!shouldHighlight || !targetText) {
      const parts: React.ReactElement[] = [];
      p.forEach((seg, i) => {
        const base = seg.bold ? 'font-bold' : undefined;
        parts.push(<span key={i} className={base}>{seg.text}</span>);
      });
      return <p key={idx} className="mt-3 leading-relaxed text-gray-800">{parts}</p>;
    }
    
    // targetText'in paragraftaki konumunu bul
    const targetStart = fullText.indexOf(targetText);
    const targetEnd = targetStart + targetText.length;
    
    if (targetStart < 0) {
      // targetText bulunamadı, normal render
      const parts: React.ReactElement[] = [];
      p.forEach((seg, i) => {
        const base = seg.bold ? 'font-bold' : undefined;
        parts.push(<span key={i} className={base}>{seg.text}</span>);
      });
      return <p key={idx} className="mt-3 leading-relaxed text-gray-800">{parts}</p>;
    }
    
    // Her segment için karakter pozisyonunu takip ederek highlight yap
    const parts: React.ReactElement[] = [];
    let charPos = 0;
    let keyCounter = 0;
    
    p.forEach((seg) => {
      const segStart = charPos;
      const segEnd = charPos + seg.text.length;
      const base = seg.bold ? 'font-bold' : '';
      
      // Bu segment targetText ile kesişiyor mu?
      if (segEnd <= targetStart || segStart >= targetEnd) {
        // Kesişmiyor - normal render
        parts.push(<span key={keyCounter++} className={base || undefined}>{seg.text}</span>);
      } else {
        // Kesişiyor - bölümlere ayır
        
        // Segment başı targetText'ten önce mi?
        if (segStart < targetStart) {
          const beforeText = seg.text.substring(0, targetStart - segStart);
          parts.push(<span key={keyCounter++} className={base || undefined}>{beforeText}</span>);
        }
        
        // Highlight edilecek kısım
        const highlightStart = Math.max(0, targetStart - segStart);
        const highlightEnd = Math.min(seg.text.length, targetEnd - segStart);
        const highlightText = seg.text.substring(highlightStart, highlightEnd);
        parts.push(
          <span key={keyCounter++} className={`rounded px-1 bg-yellow-300 ${base}`}>{highlightText}</span>
        );
        
        // Segment sonu targetText'ten sonra mı?
        if (segEnd > targetEnd) {
          const afterText = seg.text.substring(targetEnd - segStart);
          parts.push(<span key={keyCounter++} className={base || undefined}>{afterText}</span>);
        }
      }
      
      charPos = segEnd;
    });
    
    return <p key={idx} className="mt-3 leading-relaxed text-gray-800">{parts}</p>;
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    if (!story) return;
    setIsProcessingVoice(true);
    console.log('🎤 Çocuk sesi gönderiliyor (submitChildrenVoice API)...');
    
    // Calculate student phase target sentences (paragraphs 3+)
    const studentSentences = paragraphs.slice(3).map(p => 
      getFirstSentence(paragraphToPlain(p))
    ).filter(Boolean);
    
    console.log('📝 Student phase hedef cümleler:', studentSentences);
    
    try {
      // Use sessionId for consistency with DOST API
      const response: Level1ChildrenVoiceResponse = await submitChildrenVoice(
        audioBlob,
        resumeUrl,
        story.title,
        3,
        'cumle_tahmini',
        sessionId || `anon-${Date.now()}`, // sessionId (same as userId in DOST API)
        studentSentences // Target sentences for n8n comparison
      );

      console.log('✅ Çocuk sesi yanıtı alındı:', response);
      
      const responseText = response.respodKidVoice || response.message || response.text || response.response || 'Teşekkürler! Tahminlerini dinledim.';
      setChildrenVoiceResponse(responseText);
      
      // Play response audio if available
      if (response.audioBase64 && response.audioBase64.length > 100) {
        try {
          await playAudioFromBase64(response.audioBase64);
        } catch {
          // Audio playback failed, continue silently
        }
      }
    } catch (e) {
      console.error('❌ Çocuk sesi gönderim hatası:', e);
      const fallback = 'Çok iyi! Tahminlerin mantıklı görünüyor.';
      setChildrenVoiceResponse(fallback);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  if (!story) {
    return <div className="w-full max-w-5xl mx-auto px-4">Yükleniyor...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-4">3. Adım: Anlama Çalışması</h2>

      <div className="mb-4">
        <img src={getStoryImageUrl(story.image)} alt={story.title} className="w-full max-w-xs mx-auto rounded-xl shadow" />
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
            <VoiceRecorder 
              onSave={handleVoiceSubmit} 
              onPlayStart={() => { try { window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any)); } catch {} }} 
              storyId={storyId}
              level={1}
              step={3}
            />
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
