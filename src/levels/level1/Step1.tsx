import React, { useEffect, useRef, useState } from 'react';
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

  const stepAudio = '/audio/1.seviye-1.adim.mp3';
  const story = {
    id: 1,
    title: 'Büyük İşler Küçük Dostlar',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png'
  };

  useEffect(() => {
    if (started && audioRef.current && !imageAnalysisText) {
      audioRef.current.src = stepAudio;
      setMascotState('speaking');
      audioRef.current.play().then(() => {
        audioRef.current!.addEventListener('ended', () => {
          setMascotState('listening');
          handleImageAnalysis();
        }, { once: true });
      }).catch(() => setMascotState('idle'));
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
  }, [started]);

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
      const { data } = await axios.post(
        `${getApiBase()}/dost/level1`,
        { imageUrl: story.image },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const analysisText = data.message || data.text || data.response || 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak b��yük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
      setImageAnalysisText(analysisText);
      speakText(analysisText);
    } catch (e) {
      const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
      setImageAnalysisText(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsAnalyzing(false);
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

      const responseText = data.message || data.text || data.response || 'Çok güzel gözlemler! Karıncaları gerçekten iyi incelemişsin. Onların çalışkanlığı hakkındaki düşüncelerin çok değerli.';
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
            1. Seviye ile başlıyoruz. Bu seviyenin ilk basamağında metnin görselini inceleyeceğiz ve görselden yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.
          </p>
          <button onClick={() => setStarted(true)} className="bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold">
            Başla
          </button>
        </div>
      ) : (
        <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="w-full">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className={`${imageAnalysisText ? 'lg:w-1/2' : 'w-full'} transition-all duration-500`}>
              <div className="relative">
                <img src={story.image} alt={story.title} className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="font-bold">DOST görseli analiz ediyor...</p>
                    </div>
                  </div>
                )}
              </div>
              {imageAnalysisText && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Görsel Analizi:</h3>
                  <p className="text-blue-700">{imageAnalysisText}</p>
                </div>
              )}
            </div>

            {imageAnalysisText && (
              <div className="lg:w-1/2 w-full">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="bg-orange-50 rounded-lg border-l-4 border-orange-400 p-4 mb-6">
                    <p className="text-orange-800 font-medium">Görev:</p>
                    <p className="text-orange-700 text-lg">Görseli inceleyerek hikayenin ne hakkında olabileceğini tahmin et. Neler gözlemliyorsun?</p>
                  </div>

                  {!childrenVoiceResponse && (
                    <div className="text-center">
                      <p className="mb-4 text-xl font-bold text-green-700 animate-pulse">Hadi sıra sende! Mikrofona konuş</p>
                      <VoiceRecorder onSave={handleVoiceSubmit} />
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
            )}
          </div>
        </motion.div>
      )}

      <div className="fixed bottom-2 right-8 z-20 cursor-pointer transform hover:scale-105 transition-all duration-200" onClick={handleReplay}>
        <div className="relative">
          <img src="/src/assets/images/maskot-boy.png" alt="DOST Maskot" className={`w-56 md:w-64 transition-all duration-300 ${mascotState === 'speaking' ? 'animate-bounce' : ''}`} />
          {mascotState === 'speaking' && (
            <div className="absolute top-4 right-4 animate-pulse">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">🗣️ DOST konuşuyor</div>
            </div>
          )}
          {mascotState === 'listening' && (
            <div className="absolute top-4 right-4">
              <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">👂 DOST dinliyor</div>
            </div>
          )}
          {mascotState === 'listening' && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold animate-bounce shadow-lg">
              📱 Tekrar dinlemek için tıkla!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
