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
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const [isPlayingSectionAudio, setIsPlayingSectionAudio] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const { onStepCompleted, storyId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const schema = useMemo(() => getSchema(storyId || STORY_ID), [storyId]);
  const appMode = getAppMode();

  const instruction = 'Şimdi dördüncü seviyeye geçiyoruz. Bu seviyede okuma öncesinde metni gözden geçirirken yaptığımız tahminlerimiz ve belirlediğimiz okuma amacımız doğru muymuş? Bunları düşünerek şemada yer alan bilgileri numara sırasına göre oku.';

  useEffect(() => {
    // Play intro audio on component mount
    const playIntroAudio = () => {
      const el = audioRef.current;
      if (!el) {
        setTimeout(playIntroAudio, 100);
        return;
      }

      console.log('🎵 Setting up intro audio:', '/audios/level4/seviye-4-adim-1.mp3');
      el.src = '/audios/level4/seviye-4-adim-1.mp3';
      (el as any).playsInline = true;
      el.muted = false;
      el.playbackRate = getPlaybackRate();
      
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

      if (el.readyState >= 2) {
        handleCanPlay();
      } else {
        el.load();
      }
    };

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

  // Play section audio when currentSection changes
  useEffect(() => {
    if (!started || !schema || currentSection >= schema.sections.length) return;

    const playSectionAudio = async () => {
      const el = audioRef.current;
      if (!el) return;

      const section = schema.sections[currentSection];
      const audioPath = `/audios/level4/schema-${storyId || STORY_ID}-${section.id}.mp3`;
      
      console.log(`🎵 Playing section ${currentSection + 1} audio:`, audioPath);
      setIsPlayingSectionAudio(true);

      el.src = audioPath;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;

      const handleEnded = () => {
        console.log(`✅ Section ${currentSection + 1} audio finished`);
        setIsPlayingSectionAudio(false);
        setCompletedSections(prev => new Set([...prev, currentSection]));
        
        // Auto-advance to next section after a short delay
        if (currentSection < schema.sections.length - 1) {
          setTimeout(() => {
            setCurrentSection(currentSection + 1);
          }, 1000);
        } else {
          // All sections completed
          if (onStepCompleted) {
            onStepCompleted({
              totalSections: schema.sections.length,
              completed: true
            });
          }
        }
      };

      const handleError = (e: Event) => {
        console.error(`❌ Section ${currentSection + 1} audio error:`, e);
        setIsPlayingSectionAudio(false);
        // Continue even if audio fails
        setCompletedSections(prev => new Set([...prev, currentSection]));
        if (currentSection < schema.sections.length - 1) {
          setTimeout(() => {
            setCurrentSection(currentSection + 1);
          }, 1000);
        }
      };

      el.addEventListener('ended', handleEnded, { once: true });
      el.addEventListener('error', handleError, { once: true });

      try {
        await el.play();
      } catch (err) {
        console.error('Error playing section audio:', err);
        handleError(new Event('error'));
      }
    };

    playSectionAudio();
  }, [started, currentSection, schema, storyId, onStepCompleted]);

  const startFlow = async () => {
    // Stop intro audio if still playing
    const el = audioRef.current;
    if (el && introAudioPlaying) {
      el.pause();
      el.currentTime = 0;
      setIntroAudioPlaying(false);
    }

    setStarted(true);
    setCurrentSection(0);
    setCompletedSections(new Set());
  };

  const onNextSection = () => {
    if (currentSection < (schema?.sections.length || 0) - 1 && !isPlayingSectionAudio) {
      setCurrentSection(currentSection + 1);
    }
  };

  const onReplaySection = () => {
    if (!isPlayingSectionAudio && schema) {
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentSection);
        return newSet;
      });
      // Trigger re-play by resetting current section
      const tempSection = currentSection;
      setCurrentSection(-1);
      setTimeout(() => setCurrentSection(tempSection), 100);
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
            
            {/* Progress indicator */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-purple-800">
                  Şematik {currentSection + 1} / {schema.sections.length}
                </span>
                {isPlayingSectionAudio && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-xs">DOST okuyor...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {schema.sections.map((section, idx) => {
                const isCurrent = idx === currentSection;
                const isCompleted = completedSections.has(idx);
                const isFuture = idx > currentSection;
                
                return (
                  <div
                    key={section.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrent && isPlayingSectionAudio
                        ? 'border-purple-500 bg-purple-50 scale-105 shadow-lg'
                        : isCurrent
                        ? 'border-purple-500 bg-purple-50 scale-105'
                        : isCompleted
                        ? 'border-green-500 bg-green-50'
                        : isFuture
                        ? 'border-gray-300 bg-gray-50 opacity-60'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-purple-800">{section.title}</h4>
                      {isCompleted && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                      {isCurrent && isPlayingSectionAudio && (
                        <span className="text-purple-600 animate-pulse">🔊</span>
                      )}
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-bold text-purple-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={onReplaySection}
                disabled={isPlayingSectionAudio}
                className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
              >
                🔄 Tekrar Oynat
              </button>
              {!isPlayingSectionAudio && currentSection < schema.sections.length - 1 && (
                <button
                  onClick={onNextSection}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold"
                >
                  Sonraki Şematik →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
