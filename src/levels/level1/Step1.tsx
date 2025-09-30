import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../lib/api';
import { motion } from 'framer-motion';
import VoiceRecorder from '../../components/VoiceRecorder';

export default function Step1() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [imageAnalysisText, setImageAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-1-fable.mp3';
  const introText = '1. Seviye ile başlıyoruz. Bu seviyenin ilk basamağında metnin görselini inceleyeceğiz ve görselden yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.';

  // Two visual states as requested
  const preImage = '/src/assets/images/story1.png';
  const postImage = 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png';

  const story = {
    id: 1,
    title: 'Büyük İşler Küçük Dostlar',
    description: 'Karıncalar hakkında',
    image: preImage,
  };

  const displayedImage = imageAnalysisText ? postImage : story.image;

  useEffect(() => {
    if (started && audioRef.current && !imageAnalysisText) {
      audioRef.current.src = stepAudio;
      setMascotState('speaking');
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.addEventListener(
            'ended',
            () => {
              setMascotState('listening');
              handleImageAnalysis();
            },
            { once: true }
          );
        })
        .catch(() => setMascotState('idle'));
    }
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [started, imageAnalysisText]);

  useEffect(() => {
    const stopAll = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setMascotState('speaking');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.onend = () => setMascotState('listening');
      utterance.onerror = () => setMascotState('listening');
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const u = (await import('../../lib/user')).getUser();
      const { getFirstThreeParagraphFirstSentences, getFullText } = await import('../../data/stories');
      const ilkUcParagraf = getFirstThreeParagraphFirstSentences(story.id);
      const metin = getFullText(story.id);
      const { data } = await axios.post(
        `${getApiBase()}/dost/level1`,
        {
          imageUrl: postImage,
          stepNum: 1,
          storyTitle: story.title,
          userId: u?.userId || '',
          userName: u ? `${u.firstName} ${u.lastName}`.trim() : '',
          ilkUcParagraf,
          metin,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const analysisText =
        data.imageExplanation ||
        data.message ||
        data.text ||
        data.response ||
        'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
      setImageAnalysisText(analysisText);
      if (!data?.audioBase64) speakText(analysisText);
      else {
        try {
          await playAudioFromBase64(data.audioBase64 as string);
        } catch {
          speakText(analysisText);
        }
      }
    } catch (e) {
      const fallbackText =
        'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
      setImageAnalysisText(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Base64 sesi çal (ortak audioRef üstünden)
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
        // fall back to TTS happens in caller
        throw e;
      }
    }
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const file = new File([audioBlob], 'cocuk_sesi.mp3', { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('ses', file);
      formData.append('kullanici_id', '12345');
      formData.append('hikaye_adi', story.title);
      formData.append('adim', '1');
      formData.append('adim_tipi', 'gorsel_tahmini');

      const { data } = await axios.post(
        `${getApiBase()}/dost/level1/children-voice`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const responseText = data.message || data.text || data.response || 'Çok güzel gözlemler! Karıncaları gerçekten iyi incelemişsin.';
      setChildrenVoiceResponse(responseText);
      speakText(responseText);
    } catch (e) {
      const fallbackText = 'Çok güzel konuştun! Karıncaları iyi gözlemlediğin anlaşılıyor. (Çevrimdışı mod)';
      setChildrenVoiceResponse(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      setMascotState('speaking');
      audioRef.current.currentTime = 0;
      audioRef.current.play().finally(() => setMascotState('listening'));
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative mt-0">
      <audio ref={audioRef} preload="auto" />

      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-purple-800 mb-4 text-center max-w-2xl">
            1. Adım: Metnin görselini inceleme ve tahminde bulunma
          </h2>
          <p className="text-lg text-gray-600 mb-6 text-center max-w-2xl">
            {introText}
          </p>
          <button onClick={() => setStarted(true)} className="bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold">
            Başla
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Image Section */}
            <div className={`${imageAnalysisText ? 'lg:w-1/2' : 'w-full'} transition-all duration-500`}>
              <div className="relative">
                <img src={displayedImage} alt={story.title} className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="font-bold">DOST görseli analiz ediyor...</p>
                    </div>
                  </div>
                )}
              </div>
              {/* If still analyzing, show right text panel below on mobile */}
              {!imageAnalysisText && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 lg:hidden">
                  <p className="text-gray-800 mb-3">{introText}</p>
                  <div className="text-blue-700 font-medium">DOST görseli analiz ediyor...</div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className={`${imageAnalysisText ? 'lg:w-1/2' : 'lg:w-2/3'} w-full`}>
              {!imageAnalysisText ? (
                // While analyzing: show intro + analyzing pill (as in screenshot 1)
                <div className="hidden lg:block">
                  <p className="text-gray-800 text-lg">{introText}</p>
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-medium">DOST görseli analiz ediyor...</p>
                  </div>
                </div>
              ) : (
                // After analysis (screenshot 2)
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="mt-0 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Analizi:</h3>
                    <p className="text-blue-700">{imageAnalysisText}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg border-l-4 border-blue-400 p-4 mt-6">
                    <p className="text-blue-800 font-medium">Görev:</p>
                    <p className="text-blue-700">Görseli inceleyerek hikayenin ne hakkında olabileceğini tahmin et. Neler gözlemliyorsun?</p>
                  </div>

                  {!childrenVoiceResponse && (
                    <div className="mt-6 text-center">
                      <p className="mb-4 text-2xl font-bold text-green-700 animate-pulse">Hadi sıra sende!</p>
                      <p className="text-lg text-green-600">Mikrofona tıklayarak cevabını ver</p>
                    </div>
                  )}

                  {/* Keep current microphone component as-is */}
                  {!childrenVoiceResponse && (
                    <div className="mt-6">
                      <VoiceRecorder
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
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
