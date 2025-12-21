import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSchema } from '../../data/schemas';
import VoiceRecorder from '../../components/VoiceRecorder';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { playTts } from '../../lib/playTts';
import { submitSchemaSummary, getResumeResponseStep2 } from '../../lib/level4-api';
import type { RootState } from '../../store/store';
import { getRecordingDurationSync } from '../../components/SidebarSettings';

const STORY_ID = 3;

export default function L4Step2() {
  const student = useSelector((state: RootState) => state.user.student);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlayingPromptAudio, setIsPlayingPromptAudio] = useState(false);
  const [isWaitingForRecording, setIsWaitingForRecording] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
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

  // Play prompt audio when currentSection changes (no title audio in Step2, only prompt)
  useEffect(() => {
    if (!started || !schema || currentSection >= schema.sections.length) return;

    let isCancelled = false;
    let promptAudioHandled = false;
    let promptAudioHandlers: { type: string; handler: (e: Event) => void }[] = [];
    let currentTtsAudio: HTMLAudioElement | null = null;

    const playPromptAudio = async () => {
      if (isCancelled || !schema) return;
      
      const el = audioRef.current;
      if (!el) {
        if (!isCancelled) {
          setIsPlayingPromptAudio(false);
          setIsWaitingForRecording(true);
        }
        return;
      }

      // Clear previous prompt audio handlers
      // Remove all previous event listeners
      promptAudioHandlers.forEach(({ type, handler }) => {
        el.removeEventListener(type, handler);
      });
      promptAudioHandlers = [];
      
      // Clear the audio element for new prompt audio
      el.src = '';
      
      const section = schema.sections[currentSection];
      // Dosya adını metinden türet (örn: "yaşayışları" -> "schema-yasayislari.mp3")
      const titleWithoutNumber = section.title.replace(/^\d+\.\s*/, '').toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const audioPath = `/audios/level4/schema-${titleWithoutNumber}.mp3`;
      
      console.log(`🎵 Playing prompt audio for section ${currentSection + 1}:`, audioPath);
      setIsPlayingPromptAudio(true);
      setIsWaitingForRecording(false);

      el.src = audioPath;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;

      let promptAudioHandled = false;

      const handleEnded = async () => {
        if (isCancelled || promptAudioHandled) return;
        promptAudioHandled = true;
        console.log('✅ Prompt audio finished');
        setIsPlayingPromptAudio(false);
        // Prompt sesi zaten "mikrofona tıklayarak cevabını ver" diyor, direkt kayıt ekranına geç
        setIsWaitingForRecording(true);
      };

      const handleError = async (e: Event) => {
        if (isCancelled || promptAudioHandled) return;
        promptAudioHandled = true;
        console.error('❌ Prompt audio error:', e);
        setIsPlayingPromptAudio(false);
        // Fallback to TTS if audio file doesn't exist
        try {
          const promptText = `Hikayeyi okuduk, ${titleWithoutNumber.replace(/-/g, ' ')} hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.`;
          console.log('🔄 Falling back to TTS:', promptText);
          
          // Stop any TTS audio that might be playing
          if (currentTtsAudio) {
            currentTtsAudio.pause();
            currentTtsAudio = null;
          }
          
          // Create new TTS audio
          const res = await fetch("https://arge.aquateknoloji.com/webhook/dost/voice-generator", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: promptText }),
          });
          if (!res.ok) throw new Error(`TTS isteği başarısız: ${res.status}`);

          const { audioBase64 } = await res.json() as { audioBase64: string };
          const byteStr = atob(audioBase64);
          const bytes = new Uint8Array(byteStr.length);
          for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const ttsAudio = new Audio(url);
          ttsAudio.playbackRate = getPlaybackRate();
          currentTtsAudio = ttsAudio;

          await new Promise<void>((resolve, reject) => {
            if (isCancelled) {
              URL.revokeObjectURL(url);
              resolve();
              return;
            }
            
            ttsAudio.onended = () => {
              if (!isCancelled) {
                URL.revokeObjectURL(url);
                currentTtsAudio = null;
                resolve();
              }
            };
            ttsAudio.onerror = () => {
              URL.revokeObjectURL(url);
              currentTtsAudio = null;
              if (!isCancelled) reject(new Error("Ses oynatılırken hata"));
            };
            ttsAudio.play().catch(err => {
              URL.revokeObjectURL(url);
              currentTtsAudio = null;
              if (!isCancelled) {
                console.error("Ses oynatılırken hata:", err);
                reject(err);
              }
            });
          });
        } catch (ttsErr) {
          console.error('❌ TTS fallback also failed:', ttsErr);
        }
        // TTS bittikten sonra direkt kayıt ekranına geç
        if (!isCancelled) {
          setIsWaitingForRecording(true);
        }
      };

      el.addEventListener('ended', handleEnded, { once: true });
      el.addEventListener('error', handleError, { once: true });
      promptAudioHandlers.push(
        { type: 'ended', handler: handleEnded },
        { type: 'error', handler: handleError }
      );

      try {
        await el.play();
      } catch (err) {
        if (!isCancelled && !promptAudioHandled) {
          console.error('Error playing prompt audio:', err);
          handleError(new Event('error'));
        }
      }
    };

    // Start directly with prompt audio (no title audio in Step2)
    playPromptAudio();

    // Cleanup function
    return () => {
      isCancelled = true;
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
        el.src = '';
        // Remove all event listeners
        promptAudioHandlers.forEach(({ type, handler }) => {
          el.removeEventListener(type, handler);
        });
      }
      // Stop TTS audio if playing
      if (currentTtsAudio) {
        currentTtsAudio.pause();
        currentTtsAudio = null;
      }
      setIsPlayingPromptAudio(false);
    };
  }, [started, currentSection, schema, storyId]);

  const startFlow = async () => {
    setStarted(true);
    setCurrentSection(0);
    setCompletedSections(new Set());
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    if (!student || !schema) return;
    
    setIsWaitingForRecording(false);
    setIsProcessingResponse(true);

    try {
      const section = schema.sections[currentSection];
      // Step2'de sadece başlık gönderiliyor, içerik gösterilmiyor
      const sectionText = section.title;
      
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
      
      console.log(`📤 Submitting section ${currentSection + 1}/${schema.sections.length} summary`, {
        sectionNo: currentSection + 1,
        isLastSection,
        audioSize: audioBlob.size,
      });

      let response;
      if (resumeUrl) {
        // Resume from n8n webhook wait
        response = await getResumeResponseStep2(resumeUrl, {
          studentId: student.id,
          sectionTitle: section.title,
          sectionText,
          audioBase64,
          isLatestSection: isLastSection,
          sectionNo: currentSection + 1,
        });
      } else {
        // First section - initial webhook call
        response = await submitSchemaSummary({
          studentId: student.id,
          sectionTitle: section.title,
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

  const playResponseAudio = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const el = audioRef.current;
      if (!el) {
        reject(new Error('Audio element not found'));
        return;
      }

      try {
        // Stop any currently playing audio and clear previous handlers
        el.pause();
        el.currentTime = 0;
        // Clear previous event listeners by removing all and setting new src
        el.onended = null;
        el.onerror = null;
        el.src = '';
        
        const audioData = `data:audio/mp3;base64,${audioBase64}`;
        el.src = audioData;
        (el as any).playsInline = true;
        el.muted = false;
        el.playbackRate = getPlaybackRate();
        
        setIsPlayingResponse(true);
        
        const handleEnded = () => {
          setIsPlayingResponse(false);
          resolve();
        };
        
        const handleError = () => {
          setIsPlayingResponse(false);
          reject(new Error('Error playing response audio'));
        };
        
        el.addEventListener('ended', handleEnded, { once: true });
        el.addEventListener('error', handleError, { once: true });
        
        el.play().catch((err) => {
          setIsPlayingResponse(false);
          reject(err);
        });
      } catch (err) {
        setIsPlayingResponse(false);
        reject(err);
      }
    });
  };

  const onNextSection = () => {
    if (currentSection < (schema?.sections.length || 0) - 1 && !isWaitingForRecording) {
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
              {isPlayingPromptAudio && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="text-xs">
                    DOST açıklama yapıyor...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current Section Title Only (no content) */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-purple-800 mb-2">
              {currentSectionData?.title}
            </h3>
            {isPlayingPromptAudio && (
              <p className="text-sm text-purple-600 mt-2">
                🔊 DOST açıklama yapıyor...
              </p>
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

          {/* Microphone/Response Card - Always visible when started */}
          {(isPlayingPromptAudio || isWaitingForRecording || isProcessingResponse || isPlayingResponse) && (
            <div className="sticky bottom-0 bg-white border-t-2 rounded-lg shadow-lg p-2 mt-3 z-50" 
                 style={{
                   borderColor: isPlayingPromptAudio ? '#9CA3AF' : isProcessingResponse || isPlayingResponse ? '#F59E0B' : '#10B981'
                 }}>
              {isPlayingPromptAudio && (
                <>
                  <p className="text-center mb-1 text-base font-bold text-gray-500">
                    🔊 DOST açıklama yapıyor...
                  </p>
                  <div className="flex justify-center opacity-50 pointer-events-none">
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDurationSync()}
                      autoSubmit={true}
                      onSave={() => {}}
                      onPlayStart={() => {}}
                      compact={true}
                    />
                  </div>
                </>
              )}
              
              {isWaitingForRecording && !isProcessingResponse && !isPlayingResponse && !isPlayingPromptAudio && (
                <>
                  <p className="text-center mb-1 text-base font-bold text-green-700">
                    🎤 Şimdi sıra sende! Mikrofona konuş
                  </p>
                  <div className="flex justify-center">
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDurationSync()}
                      autoSubmit={true}
                      onSave={handleVoiceSubmit}
                      onPlayStart={() => {
                        try {
                          window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
                        } catch {}
                      }}
                      compact={true}
                    />
                  </div>
                </>
              )}
              
              {(isProcessingResponse || isPlayingResponse) && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                    <p className="text-orange-600 font-semibold text-base">
                      {isProcessingResponse ? '⏳ DOST değerlendiriyor...' : '🔊 DOST geri bildirim veriyor...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed indicator */}
          {completedSections.has(currentSection) && !isProcessingResponse && !isPlayingResponse && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
              <p className="text-green-700 font-semibold">
                ✓ "{currentSectionData?.title}" özetlendi!
              </p>
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
