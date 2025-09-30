import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../lib/api';
import { getUser } from '../../lib/user';
import VoiceRecorder from '../../components/VoiceRecorder';

export default function Step2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [marked, setMarked] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Contract intro for step 2
  const introAudio = '/src/assets/audios/level1/seviye-1-adim-2-fable.mp3';
  const story = {
    id: 1,
    title: 'Büyük İşler Küçük Dostlar',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png',
  };

  useEffect(() => {
    if (started && !analysisText) {
      // Safety fallback: if audio can't start/finish quickly, run analysis after timeout
      const safety = window.setTimeout(() => {
        try { if (!analysisText) speakTitleThenAnalyze(); } catch {}
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
                speakTitleThenAnalyze();
              },
              { once: true }
            );
          })
          .catch(() => { setMascotState('idle'); speakTitleThenAnalyze(); });
      } else {
        // No audio element, go straight to analysis
        speakTitleThenAnalyze();
      }
      return () => {
        window.clearTimeout(safety);
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
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setMascotState('listening');
      utterance.onerror = () => setMascotState('listening');
      speechSynthesis.speak(utterance);
    }
  };

  const speakTitleThenAnalyze = () => {
    if ('speechSynthesis' in window) {
      setMascotState('speaking');
      const utter = new SpeechSynthesisUtterance(story.title);
      utter.lang = 'tr-TR';
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.onend = () => {
        setMascotState('listening');
        handleTitleAnalysis();
      };
      utter.onerror = () => {
        setMascotState('listening');
        handleTitleAnalysis();
      };
      speechSynthesis.speak(utter);
    } else {
      handleTitleAnalysis();
    }
  };

  const handleTitleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data } = await axios.post(
        `${getApiBase()}/dost/level1/step2`,
        { title: story.title, imageUrl: story.image, step: 2 },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log("Step2.tsx ,",data );

      const text =
        data.imageExplanation ||
        data.titleExplanation ||
        data.text ||
        data.message ||
        'Başlık "Büyük İşler Küçük Dostlar" karıncaların iş birliğini vurguluyor. Başlıktan yola çıkarak metnin iş birliği, azim ve yardımlaşma temasını işleyeceğini tahmin edebiliriz.';
      setAnalysisText(text);
      speakText(text);
    } catch (e) {
      const fallback =
        'Şimdi bu seviyenin ikinci basamağında metnin başlığını inceleyeceğiz. Başlık "Büyük İşler Küçük Dostlar" karıncaların birlikte çalışmasını anlatıyor olabilir. Sence başlık bize neler söylüyor?';
      setAnalysisText(fallback);
      speakText(fallback);
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
      formData.append('adim', '2');
      formData.append('adim_tipi', 'baslik_tahmini');

      const { data } = await axios.post(
        `${getApiBase()}/dost/level1/children-voice`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const responseText =
        data.message ||
        data.text ||
        data.response ||
        'Harika bir tahmin! Başlıktan yola çıkarak çok güzel fikirler ürettin.';
      setChildrenVoiceResponse(responseText);
      speakText(responseText);
    } catch (e) {
      const fallback = 'Çok güzel düşünmüşsün! (Çevrimdışı mod)';
      setChildrenVoiceResponse(fallback);
      speakText(fallback);
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
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-purple-800 mb-2">
              2. Adım: Metnin başlığını inceleme ve tahminde bulunma
            </h2>
            <p className="text-gray-700">
              Şimdi bu seviyenin ikinci basamağında metnin başlığını inceleyeceğiz ve başlıktan yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.
            </p>
          </div>
          <button
            onClick={async () => {
              setStarted(true);
              setMarked(true);
              try {
                const u = getUser();
                await axios.post(`${getApiBase()}/dost/level1/step2`, { stepNum: 2, userId: u?.userId || '' }, { headers: { 'Content-Type': 'application/json' } });
              } catch (e) {}
            }}
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
                {analysisText && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Başlık Analizi:</h3>
                    <p className="text-blue-700">{analysisText}</p>
                  </div>
                )}


                {analysisText && !childrenVoiceResponse && (
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
          </div>
        </div>
      )}

    </div>
  );
}
