import { useEffect, useMemo, useRef, useState } from 'react';
import { getParagraphs, type Paragraph } from '../../data/stories';
import { useNavigate } from 'react-router-dom';
import { analyzeObjectiveForStep4 } from '../../lib/level1-api';
import type { Level1ObjectiveAnalysisResponse } from '../../types';

export default function Step4() {
  const story = {
    id: 1,
    title: 'Oturum 1: Kır��ntıların Kahramanları',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png',
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro' | 'text' | 'objective'>('intro');
  const [objectiveText, setObjectiveText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-4-fable.mp3';
  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const navigate = useNavigate();

  const hasCalledApi = useRef(false);

  useEffect(() => {
    const el = audioRef.current;
    const onEnded = () => {
      setPhase('text');
      setTimeout(() => {
        if (!hasCalledApi.current) {
          hasCalledApi.current = true;
          setPhase('objective');
          handleObjectiveAnalysis();
        }
      }, 600);
    };
    if (el) {
      el.src = stepAudio;
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
        userId: '',
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

  const onClickTamamla = () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    navigate('/level/1/completion');
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0">
      <audio ref={audioRef} preload="auto" />
      <div className="flex-shrink-0 mt-4">
        <img src={story.image} alt={story.title} className="rounded-lg shadow-lg w-64 md:w-80" />
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
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Açıklaması:</h3>
                <p className="text-blue-700">{objectiveText}</p>
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
