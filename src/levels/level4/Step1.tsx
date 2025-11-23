import { useEffect, useMemo, useRef, useState } from 'react';
import { getSchema } from '../../data/schemas';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

const STORY_ID = 3;

export default function L4Step1() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [playedAudio, setPlayedAudio] = useState(false);
  const { onStepCompleted } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const schema = useMemo(() => getSchema(STORY_ID), []);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
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
          <button onClick={startFlow} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
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
