import { useEffect, useRef, useState } from 'react';
import { getParagraphs, type Paragraph, getStoryCategory } from '../../data/stories';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeObjectiveForStep4 } from '../../lib/level1-api';
import type { Level1ObjectiveAnalysisResponse } from '../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getStoryById } from '../../lib/supabase';
import { getStoryImageUrl } from '../../lib/image-utils';

export default function Step4() {
  const [searchParams] = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro' | 'text' | 'objective'>('intro');
  const [objectiveText, setObjectiveText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [categoryBasedMessage, setCategoryBasedMessage] = useState<string>('');

  const currentStudent = useSelector((state: RootState) => state.user.student);
  const { sessionId, onStepCompleted, storyId: contextStoryId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);
  
  // Use storyId from context if available, otherwise from searchParams
  const storyIdFromParams = Number(searchParams.get('storyId')) || 1;
  const finalStoryId = contextStoryId || storyIdFromParams;
  const [story, setStory] = useState<{ id: number; title: string; description: string; image: string } | null>(null);

  // Load story data from Supabase
  useEffect(() => {
    const loadStory = async () => {
      try {
        const { data, error } = await getStoryById(finalStoryId);
        if (error || !data) {
          // Fallback to default story - use local image path
          setStory({
            id: finalStoryId,
            title: `Oturum ${finalStoryId}`,
            description: '',
            image: `/images/story${finalStoryId}.png`,
          });
        } else {
          // Use image from Supabase if available, otherwise use local path
          const imagePath = data.image || `/images/story${finalStoryId}.png`;
          setStory({
            id: data.id,
            title: data.title,
            description: data.description || '',
            image: imagePath,
          });
        }
      } catch (e) {
        // Fallback to default story - use local image path
        setStory({
          id: finalStoryId,
          title: `Oturum ${finalStoryId}`,
          description: '',
          image: `/images/story${finalStoryId}.png`,
        });
      }
    };
    loadStory();
  }, [finalStoryId]);

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-4-fable.mp3';
  const navigate = useNavigate();

  const apiCallStarted = useRef(false);

  useEffect(() => {
    const paras = getParagraphs(finalStoryId);
    setParagraphs(paras);
    
    // Get category-based reading objective message
    const category = getStoryCategory(finalStoryId);
    if (category) {
      let message = '';
      if (category === 'Hayvanlarla ilgili metinler') {
        message = 'Hayvanlarla ilgili metinlerde; hayvanların yaşayışları, fiziksel özellikleri, beslenmeleri, çoğalmaları, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      } else if (category === 'Bitkilerle ilgili metinler') {
        message = 'Bitkilerle ilgili metinlerde; bitkilerin yaşam koşulları, fiziksel özellikleri, çoğalmaları, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      } else if (category === 'Elektronik araçlarla ilgili metinler') {
        message = 'Elektronik araçlarla ilgili metinlerde; elektronik araçların kullanım amaçları, fiziksel özellikleri, çalışma biçimleri, üretimleri, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      } else if (category === 'Coğrafi Bölgelerle İlgili ilgili metinler') {
        message = 'Coğrafi Bölgelerle İlgili metinlerde; coğrafi bölgelerin iklimi, bitki örtüsü, yeryüzü özellikleri, ekonomik faaliyetleri, nüfus ve yerleşmesi hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      }
      setCategoryBasedMessage(message);
    }
  }, [finalStoryId]);

  useEffect(() => {
    const el = audioRef.current;
    const onEnded = () => {
      setPhase('text');
      if (!apiCallStarted.current) {
        apiCallStarted.current = true;
        setPhase('objective');
        handleObjectiveAnalysis();
      }
    };
    if (el) {
      el.src = stepAudio;
      // Apply playback rate
      el.playbackRate = getPlaybackRate();
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;
      el.play()
        .then(() => el.addEventListener('ended', onEnded, { once: true }))
        .catch(onEnded);
    } else {
      onEnded();
    }
    const stopAll = () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
    };
  }, []);

  const playAudioFromBase64 = async (base64: string) => {
    if (!audioRef.current || !base64) return;
    const tryMime = async (mime: string) => {
      const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
      audioRef.current!.src = src;
      // Apply playback rate
      audioRef.current!.playbackRate = getPlaybackRate();

      // Reset progress
      setAudioProgress(0);
      setAudioDuration(0);

      // Update duration when metadata is loaded
      const onLoadedMetadata = () => {
        setAudioDuration(audioRef.current?.duration || 0);
      };

      // Update progress during playback
      const onTimeUpdate = () => {
        setAudioProgress(audioRef.current?.currentTime || 0);
      };

      // Clean up when done
      const onEnded = () => {
        setAudioProgress(0);
        setAudioDuration(0);
        audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioRef.current?.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current?.removeEventListener('ended', onEnded);
      };

      audioRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
      audioRef.current?.addEventListener('timeupdate', onTimeUpdate);
      audioRef.current?.addEventListener('ended', onEnded);

      await audioRef.current?.play();
    };
    try {
      await tryMime('audio/mpeg');
    } catch {
      try {
        await tryMime('audio/webm;codecs=opus');
      } catch {
        try {
          await tryMime('audio/wav');
        } catch {
          // Fallback: just don't play if all formats fail
        }
      }
    }
  };

  const handleObjectiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response: Level1ObjectiveAnalysisResponse = await analyzeObjectiveForStep4({
        stepNum: 4,
        // Alan adı "userId" kalıyor (n8n bunu bekliyor) ama değer sessionId
        userId: sessionId || `anon-${Date.now()}`,
      });

      const text = 
        response.answer || 
        response.message || 
        response.text || 
        response.response ||
        response.textAudio || 
        '';

      setObjectiveText(text);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
          setPhase('objective');
        } catch {
          setPhase('objective');
        }
      } else {
        setPhase('objective');
      }
    } catch (e) {
      setObjectiveText('');
      setPhase('objective');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderParagraph = (p: Paragraph, idx: number) => (
    <p key={idx} className="mt-3 leading-relaxed text-gray-800">
      {p.map((seg, i) => (
        <span key={i} className={seg.bold ? 'font-bold' : undefined}>
          {seg.text}
        </span>
      ))}
    </p>
  );

  const onClickTamamla = async () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    
    // Mark step as completed
    if (onStepCompleted && objectiveText) {
      await onStepCompleted({
        objectiveText
      });
    }
    
    navigate(`/level/1/completion?storyId=${finalStoryId}`);
  };

  if (!story) {
    return <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0">Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0">
      <audio ref={audioRef} preload="auto" />
      <div className="flex-shrink-0 mt-4">
        <img src={getStoryImageUrl(story.image)} alt={story.title} className="rounded-lg shadow-lg w-64 md:w-80" />
      </div>
      <div className="text-lg text-gray-800 leading-relaxed max-w-xl w-full">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">4. Adım: Okuma amacı belirleme</h2>

        {phase === 'intro' && (
          <p className="mt-2 text-gray-800">
            Bu seviyenin son basamağına geldik. Bu basamakta karşımıza çıkan metinler için okuma amaçları belirlememiz gerekiyor.
          </p>
        )}

        {phase !== 'intro' && (
          <div className="space-y-4">
            {!objectiveText && (
              <div className="bg-white rounded-xl shadow p-4">
                <div className="p-4 mb-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 font-medium">DOST okuma amaçını analiz ediyor...</p>
                </div>
                <div className="text-base md:text-lg">{paragraphs.map((p, idx) => renderParagraph(p, idx))}</div>
              </div>
            )}

            {objectiveText && phase === 'objective' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Açıklaması:</h3>
                  <p className="text-blue-700">{objectiveText}</p>
                </div>
                
                {categoryBasedMessage && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-bold text-green-800 mb-2">📚 Okuma Amacı:</h3>
                    <p className="text-green-700">{categoryBasedMessage}</p>
                  </div>
                )}
              </div>
            )}

            {phase === 'objective' && audioDuration > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                    style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {Math.floor(audioProgress)}saniye / {Math.floor(audioDuration)}saniye
                </p>
              </div>
            )}

            {objectiveText && (
              <div className="pt-4 text-center">
                <button
                  onClick={onClickTamamla}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition"
                >
                  So Adıma Geç
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
