import { useEffect, useRef, useState } from 'react';
import { getRecordingDuration } from '../../components/SidebarSettings';
import { analyzeTitleForStep2, submitChildrenVoice } from '../../lib/level1-api';
import VoiceRecorder from '../../components/VoiceRecorder';
import type { Level1TitleAnalysisResponse, Level1ChildrenVoiceResponse } from '../../types';

export default function Step2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');

  const introAudio = '/src/assets/audios/level1/seviye-1-adim-2-fable.mp3';
  const story = {
    id: 1,
    title: 'Oturum 1: Kırıntıların Kahramanları',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png',
  };

  useEffect(() => {
    if (started && !analysisText) {
      const safety = window.setTimeout(() => {
        try {
          if (!analysisText) handleTitleAnalysis();
        } catch {}
      }, 2000);

      if (audioRef.current) {
        audioRef.current.src = introAudio;
        setMascotState('speaking');
        audioRef.current
          .play()
          .then(() => {
            audioRef.current!.addEventListener(
              'ended',
              () => {
                setMascotState('listening');
                handleTitleAnalysis();
              },
              { once: true }
            );
          })
          .catch(() => {
            setMascotState('listening');
            handleTitleAnalysis();
          });
      } else {
        handleTitleAnalysis();
      }

      return () => {
        window.clearTimeout(safety);
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } catch {}
        }
      };
    }

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    };
  }, [started, analysisText]);


  const playAudioFromBase64 = async (base64: string) => {
    if (!audioRef.current || !base64) return;
    const tryMime = async (mime: string) => {
      const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
      audioRef.current!.src = src;
      setMascotState('speaking');
      await audioRef.current!.play();
      audioRef.current!.addEventListener('ended', () => setMascotState('listening'), { once: true });
    };
    try {
      await tryMime('audio/mpeg');
    } catch {
      try {
        await tryMime('audio/webm;codecs=opus');
      } catch (e) {
        setMascotState('listening');
        throw e;
      }
    }
  };

  const handleTitleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response: Level1TitleAnalysisResponse = await analyzeTitleForStep2({
        stepNum: 2,
        userId: '',
      });

      const text =
        response.titleExplanation ||
        response.imageExplanation ||
        response.message ||
        response.text ||
        response.response ||
        '';

      setAnalysisText(text);
      setResumeUrl(response.resumeUrl);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
        } catch (e) {
          setMascotState('listening');
        }
      } else {
        setMascotState('listening');
      }
    } catch (e) {
      setAnalysisText('');
      setMascotState('listening');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const response: Level1ChildrenVoiceResponse = await submitChildrenVoice(
        audioBlob,
        resumeUrl,
        story.title,
        2,
        'baslik_tahmini'
      );

      const responseText =
        response.respodKidVoice ||
        response.message ||
        response.text ||
        response.response ||
        '';

      setChildrenVoiceResponse(responseText);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
        } catch (e) {
          setMascotState('listening');
        }
      } else {
        setMascotState('listening');
      }
    } catch (e) {
      setChildrenVoiceResponse('');
      setMascotState('listening');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative mt-0">
      <audio ref={audioRef} preload="auto" />

      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-purple-800 mb-2">
              2. Adım: Metnin başlığını inceleme ve tahminde bulunma
            </h2>
            <p className="text-gray-700">
              Şimdi bu seviyenin ikinci basamağında metnin başlığını inceleyeceğiz ve başlıktan yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.
            </p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-6 bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold"
          >
            Başla
          </button>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2 w-full">
              <div className="relative">
                <img src={story.image} alt={story.title} className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-purple-800 text-center">{story.title}</h2>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {isAnalyzing && !analysisText && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                    <p className="text-blue-700 font-medium">DOST başlığı analiz ediyor...</p>
                  </div>
                )}

                {analysisText && !childrenVoiceResponse && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Başlık Analizi:</h3>
                    <p className="text-blue-700">{analysisText}</p>
                  </div>
                )}

                {analysisText && !childrenVoiceResponse && (
                  <div className="text-center">
                    <p className="mb-4 text-xl font-bold text-green-700 animate-pulse">Hadi sıra sende! Mikrofona konuş</p>
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDuration()}
                      autoSubmit={true}
                      onSave={handleVoiceSubmit}
                      onPlayStart={() => {
                        try {
                          window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
                        } catch {}
                      }}
                    />
                    {isProcessingVoice && (
                      <p className="mt-4 text-blue-600 font-medium">DOST senin sözlerini değerlendiriyor...</p>
                    )}
                  </div>
                )}

                {childrenVoiceResponse && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-bold text-green-800 mb-2">🗣️ DOST'un Yorumu:</h3>
                    <p className="text-green-700 text-lg">{childrenVoiceResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
