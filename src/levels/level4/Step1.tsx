import { useEffect, useMemo, useRef, useState } from 'react';
import { getSchema } from '../../data/schemas';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getAppMode } from '../../lib/api';

const STORY_ID = 3;

export default function L4Step1() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [playedAudio, setPlayedAudio] = useState(false);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const { onStepCompleted } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const schema = useMemo(() => getSchema(STORY_ID), []);
  const appMode = getAppMode();

  const instruction = 'Şimdi dördüncü seviyeye geçiyoruz. Bu seviyede okuma öncesinde metni gözden geçirirken yaptığımız tahminlerimiz ve belirlediğimiz okuma amacımız doğru muymuş? Bunları düşünerek şemada yer alan bilgileri numara sırasına göre oku.';

  useEffect(() => {
    // Play intro audio on component mount
    const playIntroAudio = () => {
      const el = audioRef.current;
      if (!el) {
        // Retry if audio element not ready yet
        setTimeout(playIntroAudio, 100);
        return;
      }

      console.log('🎵 Setting up intro audio:', '/audios/level4/seviye-4-adim-1.mp3');
      el.src = '/audios/level4/seviye-4-adim-1.mp3';
      (el as any).playsInline = true;
      el.muted = false;
      // Apply playback rate
      el.playbackRate = getPlaybackRate();
      
      // Wait for audio to be ready
      const handleCanPlay = () => {
        console.log('✅ Audio can play, readyState:', el.readyState);
        el.play().then(() => {
          console.log('✅ Intro audio started playing');
          setIntroAudioPlaying(true);
        }).catch((err) => {
          console.error('❌ Error playing intro audio:', err);
          setIntroAudioPlaying(false);
        });
      };

      const handleEnded = () => {
        console.log('✅ Intro audio finished');
        setIntroAudioPlaying(false);
      };

      const handleError = (e: Event) => {
        console.error('❌ Intro audio error:', e, el.error);
        setIntroAudioPlaying(false);
      };

      el.addEventListener('canplay', handleCanPlay, { once: true });
      el.addEventListener('ended', handleEnded, { once: true });
      el.addEventListener('error', handleError, { once: true });

      // If already loaded, play immediately
      if (el.readyState >= 2) {
        console.log('✅ Audio already loaded, playing immediately');
        handleCanPlay();
      } else {
        // Load the audio
        el.load();
      }
    };

    // Start after a small delay to ensure audio element is mounted and hook has applied playback rate
    const timeoutId = setTimeout(playIntroAudio, 200);

    const stopAll = () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      try { 
        window.speechSynthesis.cancel(); 
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {} 
    };
  }, []);

  const playAudio = async (audioPath: string) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        await el.play();
      } catch {}
    }
  };

  const startFlow = async () => {
    // Stop intro audio if still playing
    const el = audioRef.current;
    if (el && introAudioPlaying) {
      el.pause();
      el.currentTime = 0;
      setIntroAudioPlaying(false);
    }

    setStarted(true);
    setPlayedAudio(false);
    await playAudio('/src/assets/audios/level4/level4-step1-intro.mp3');
    setPlayedAudio(true);
  };

  const onNextSection = async () => {
    if (currentSection < (schema?.sections.length || 0) - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      // All sections completed
      if (onStepCompleted) {
        await onStepCompleted({
          totalSections: schema?.sections.length || 0,
          completed: true
        });
      }
    }
  };

  if (!schema) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Şema bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">1. Adım: Dolu Şema Üzerinden Beyin Fırtınası ve Yorum</h2>
        {!started && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mb-4">
              <p className="text-gray-700 text-left leading-relaxed">
                {instruction}
              </p>
            </div>
            <div className="flex justify-center">
              {appMode === 'prod' && introAudioPlaying ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  <p className="text-gray-600">Ses çalınıyor...</p>
                </div>
              ) : (
                <button 
                  onClick={startFlow} 
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
                >
                  Başla
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {started && (
        <div className="bg-white rounded-xl shadow p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-center mb-8 text-gray-800">{schema.title}</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              {schema.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    idx === currentSection
                      ? 'border-purple-500 bg-purple-50 scale-105'
                      : idx < currentSection
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50 opacity-60'
                  }`}
                >
                  <h4 className="font-bold text-purple-800 mb-3">{section.title}</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-purple-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {playedAudio && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-center text-gray-800 font-semibold">
                  {currentSection < schema.sections.length
                    ? `${schema.sections[currentSection].title} hakkında neler ��ğrendin? DOST'un sorularını cevaplayabilirsin.`
                    : 'Tüm şemaları inceledik! Harika!'}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={onNextSection}
                disabled={currentSection >= schema.sections.length - 1}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
              >
                Sonraki Bölüm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
