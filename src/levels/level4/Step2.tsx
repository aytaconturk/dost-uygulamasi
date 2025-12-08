import { useEffect, useMemo, useRef, useState } from 'react';
import { getSchema } from '../../data/schemas';
import VoiceRecorder from '../../components/VoiceRecorder';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

const STORY_ID = 3;

export default function L4Step2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlayingTitleAudio, setIsPlayingTitleAudio] = useState(false);
  const [isWaitingForRecording, setIsWaitingForRecording] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const { onStepCompleted, storyId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const schema = useMemo(() => getSchema(storyId || STORY_ID), [storyId]);

  useEffect(() => {
    return () => { 
      try { 
        window.speechSynthesis.cancel(); 
      } catch {} 
    };
  }, []);

  // Play section title audio when currentSection changes
  useEffect(() => {
    if (!started || !schema || currentSection >= schema.sections.length) return;

    const playTitleAudio = async () => {
      const el = audioRef.current;
      if (!el) return;

      const section = schema.sections[currentSection];
      // Audio path: /audios/level4/schema-{storyId}-{sectionId}-title.mp3
      const audioPath = `/audios/level4/schema-${storyId || STORY_ID}-${section.id}-title.mp3`;
      
      console.log(`🎵 Playing section ${currentSection + 1} title audio:`, audioPath);
      setIsPlayingTitleAudio(true);
      setIsWaitingForRecording(false);

      el.src = audioPath;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;

      const handleEnded = () => {
        console.log(`✅ Section ${currentSection + 1} title audio finished`);
        setIsPlayingTitleAudio(false);
        // Play "Şimdi sıra sende" audio
        playSiraSendeAudio();
      };

      const handleError = (e: Event) => {
        console.error(`❌ Section ${currentSection + 1} title audio error:`, e);
        setIsPlayingTitleAudio(false);
        // Continue even if audio fails
        playSiraSendeAudio();
      };

      el.addEventListener('ended', handleEnded, { once: true });
      el.addEventListener('error', handleError, { once: true });

      try {
        await el.play();
      } catch (err) {
        console.error('Error playing title audio:', err);
        handleError(new Event('error'));
      }
    };

    const playSiraSendeAudio = async () => {
      const el = audioRef.current;
      if (!el) {
        setIsWaitingForRecording(true);
        return;
      }

      const siraSendePath = '/audios/sira-sende-mikrofon.mp3';
      console.log('🎵 Playing "Şimdi sıra sende" audio');
      
      el.src = siraSendePath;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;

      const handleEnded = () => {
        console.log('✅ "Şimdi sıra sende" audio finished');
        setIsWaitingForRecording(true);
      };

      const handleError = (e: Event) => {
        console.error('❌ "Şimdi sıra sende" audio error:', e);
        setIsWaitingForRecording(true);
      };

      el.addEventListener('ended', handleEnded, { once: true });
      el.addEventListener('error', handleError, { once: true });

      try {
        await el.play();
      } catch (err) {
        console.error('Error playing "sıra sende" audio:', err);
        setIsWaitingForRecording(true);
      }
    };

    playTitleAudio();
  }, [started, currentSection, schema, storyId]);

  const startFlow = async () => {
    setStarted(true);
    setCurrentSection(0);
    setCompletedSections(new Set());
  };

  const handleVoiceSubmit = async (blob: Blob) => {
    console.log(`✅ Voice submitted for section ${currentSection + 1}`);
    
    // Mark current section as completed
    setCompletedSections(prev => new Set([...prev, currentSection]));
    setIsWaitingForRecording(false);

    // Move to next section
    if (currentSection < (schema?.sections.length || 0) - 1) {
      setTimeout(() => {
        setCurrentSection(currentSection + 1);
      }, 1500);
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

  const onNextSection = () => {
    if (currentSection < (schema?.sections.length || 0) - 1 && !isPlayingTitleAudio && !isWaitingForRecording) {
      setCurrentSection(currentSection + 1);
    }
  };

  if (!schema) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Şema bulunamadı</p>
      </div>
    );
  }

  const currentSectionData = schema.sections[currentSection];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">2. Adım: Özetleme</h2>
        {!started && (
          <button 
            onClick={startFlow} 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Başla
          </button>
        )}
      </div>

      {started && (
        <div className="bg-white rounded-xl shadow p-8 space-y-6">
          {/* Progress indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-purple-800">
                Şematik {currentSection + 1} / {schema.sections.length}
              </span>
              {isPlayingTitleAudio && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="text-xs">DOST başlığı okuyor...</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Section Title Only (no content) */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-purple-800 mb-2">
              {currentSectionData?.title}
            </h3>
            {isPlayingTitleAudio && (
              <p className="text-sm text-purple-600 mt-2">🔊 DOST başlığı okuyor...</p>
            )}
          </div>

          {/* All Section Titles (for reference) */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h4 className="text-lg font-bold text-blue-800 mb-3">Tüm Şematik Başlıkları</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schema.sections.map((section, idx) => {
                const isCurrent = idx === currentSection;
                const isCompleted = completedSections.has(idx);
                
                return (
                  <div
                    key={section.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isCurrent
                        ? 'border-purple-500 bg-purple-100 font-bold'
                        : isCompleted
                        ? 'border-green-500 bg-green-100'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isCurrent ? 'text-purple-800' : isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                        {section.title}
                      </span>
                      {isCompleted && (
                        <span className="text-green-600 text-lg">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recording Section */}
          {isWaitingForRecording && !completedSections.has(currentSection) && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 space-y-4">
              <p className="text-center text-gray-800 font-semibold text-lg">
                🎤 Şimdi sıra sende! "{currentSectionData?.title}" başlığını özetle
              </p>
              <VoiceRecorder
                onSave={handleVoiceSubmit}
                recordingDurationMs={60000} // 60 seconds
                autoSubmit={false}
              />
            </div>
          )}

          {/* Completed indicator */}
          {completedSections.has(currentSection) && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
              <p className="text-green-700 font-semibold">
                ✓ "{currentSectionData?.title}" özetlendi!
              </p>
            </div>
          )}

          {/* Navigation */}
          {!isPlayingTitleAudio && !isWaitingForRecording && currentSection < schema.sections.length - 1 && (
            <div className="flex justify-center">
              <button
                onClick={onNextSection}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Sonraki Şematik →
              </button>
            </div>
          )}

          {/* Completion message */}
          {completedSections.size === schema.sections.length && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 text-center">
              <p className="text-green-700 font-bold text-lg">
                🎉 Tüm şematikler özetlendi! Harika iş çıkardın!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
