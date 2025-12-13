import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSchema } from '../../data/schemas';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getAppMode } from '../../lib/api';
import { submitSchemaSectionReading, getResumeResponse } from '../../lib/level4-api';
import type { RootState } from '../../store/store';
import VoiceRecorder from '../../components/VoiceRecorder';
import { getRecordingDuration } from '../../components/SidebarSettings';

const STORY_ID = 3;

export default function L4Step1() {
  const student = useSelector((state: RootState) => state.user.student);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const [isPlayingSectionAudio, setIsPlayingSectionAudio] = useState(false);
  const [isWaitingForRecording, setIsWaitingForRecording] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
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
        // Show recording interface
        setIsWaitingForRecording(true);
      };

      const handleError = (e: Event) => {
        console.error(`❌ Section ${currentSection + 1} audio error:`, e);
        setIsPlayingSectionAudio(false);
        // Show recording interface even if audio fails
        setIsWaitingForRecording(true);
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
  }, [started, currentSection, schema, storyId]);

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    if (!student || !schema) return;
    
    setIsWaitingForRecording(false);
    setIsProcessingResponse(true);

    try {
      const section = schema.sections[currentSection];
      const sectionTitle = section.title;
      const sectionItems = section.items.join('\n');
      const sectionText = `${sectionTitle}\n${sectionItems}`;
      
      // Convert audio blob to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64String = base64.split(',')[1] || base64;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const isLastSection = currentSection === schema.sections.length - 1;
      
      console.log(`📤 Submitting section ${currentSection + 1}/${schema.sections.length}`, {
        sectionNo: currentSection + 1,
        isLastSection,
        audioSize: audioBlob.size,
      });

      let response;
      if (resumeUrl) {
        // Resume from n8n webhook wait
        response = await getResumeResponse(resumeUrl, {
          studentId: student.id,
          sectionTitle,
          sectionText,
          audioBase64,
          isLatestSection: isLastSection,
          sectionNo: currentSection + 1,
        });
      } else {
        // First section - initial webhook call
        response = await submitSchemaSectionReading({
          studentId: student.id,
          sectionTitle,
          sectionText,
          audioBase64,
          isLatestSection: isLastSection,
          sectionNo: currentSection + 1,
        });
      }

      console.log(`✅ Received response for section ${currentSection + 1}:`, {
        hasAudio: !!response.audioBase64,
        hasResumeUrl: !!response.resumeUrl,
      });

      // Store resume URL for next section
      if (response.resumeUrl) {
        setResumeUrl(response.resumeUrl);
      }

      // Play n8n response audio
      if (response.audioBase64) {
        await playResponseAudio(response.audioBase64);
      }

      // Mark section as completed
      setCompletedSections(prev => new Set([...prev, currentSection]));

      // Move to next section or complete
      if (isLastSection) {
        console.log('✅ All sections completed!');
        if (onStepCompleted) {
          onStepCompleted({
            totalSections: schema.sections.length,
            completed: true,
          });
        }
      } else {
        // Auto-advance to next section
        setTimeout(() => {
          setCurrentSection(currentSection + 1);
        }, 1000);
      }

    } catch (err) {
      console.error('Failed to process voice recording:', err);
      alert('Ses kaydı işlenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const playResponseAudio = async (audioBase64: string) => {
    const el = audioRef.current;
    if (!el) return;

    setIsPlayingResponse(true);

    try {
      const audioSrc = audioBase64.startsWith('data:') 
        ? audioBase64 
        : `data:audio/mpeg;base64,${audioBase64}`;
      
      el.src = audioSrc;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;

      await new Promise<void>((resolve, reject) => {
        const handleEnded = () => {
          setIsPlayingResponse(false);
          resolve();
        };
        const handleError = () => {
          setIsPlayingResponse(false);
          reject(new Error('Audio playback failed'));
        };

        el.addEventListener('ended', handleEnded, { once: true });
        el.addEventListener('error', handleError, { once: true });

        el.play().catch(reject);
      });
    } catch (err) {
      console.error('Failed to play response audio:', err);
      setIsPlayingResponse(false);
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
    setCurrentSection(0);
    setCompletedSections(new Set());
  };

  const onReplaySection = () => {
    if (!isPlayingSectionAudio && !isWaitingForRecording && !isProcessingResponse && !isPlayingResponse && schema) {
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentSection);
        return newSet;
      });
      setIsWaitingForRecording(false);
      setIsProcessingResponse(false);
      setIsPlayingResponse(false);
      
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

            {/* Voice Recording Interface */}
            {isWaitingForRecording && !isProcessingResponse && !isPlayingResponse && (
              <div className="mt-6 text-center">
                <p className="mb-4 text-xl font-bold text-green-700">Sıra sende! Şematiği sesli oku</p>
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
              </div>
            )}

            {/* Processing Status */}
            {isProcessingResponse && (
              <div className="mt-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                  <p className="text-purple-600 font-medium">DOST değerlendiriyor...</p>
                </div>
              </div>
            )}

            {/* Response Audio Playing */}
            {isPlayingResponse && (
              <div className="mt-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="text-4xl animate-pulse">🔊</div>
                  <p className="text-blue-600 font-medium">DOST geri bildirim veriyor...</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={onReplaySection}
                disabled={isPlayingSectionAudio || isWaitingForRecording || isProcessingResponse || isPlayingResponse}
                className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
              >
                🔄 Tekrar Oynat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
