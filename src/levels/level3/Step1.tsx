import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getParagraphsAsync, paragraphToPlain, getParagraphCountAsync } from '../../data/stories';
import { getAppMode } from '../../lib/api';
import { submitParagraphReading, getResumeResponse } from '../../lib/level3-api';
import type { RootState } from '../../store/store';
import VoiceRecorder from '../../components/VoiceRecorder';
import type { Paragraph } from '../../data/stories';
import { getRecordingDuration } from '../../components/SidebarSettings';
import { useStepContext } from '../../contexts/StepContext';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getPlaybackRate } from '../../components/SidebarSettings';

export default function L3Step1() {
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const { sessionId, onStepCompleted } = useStepContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const [started, setStarted] = useState(false);
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [storyId, setStoryId] = useState<number | null>(null);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);
  const [isPlayingSiraSende, setIsPlayingSiraSende] = useState(false);
  const [isWaitingForRecording, setIsWaitingForRecording] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [apiResponseText, setApiResponseText] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [allParagraphsCompleted, setAllParagraphsCompleted] = useState(false);
  const [completedParagraphs, setCompletedParagraphs] = useState<Set<number>>(new Set());
  const appMode = getAppMode();

  // Get storyId from URL params
  useEffect(() => {
    const storyIdParam = searchParams.get('storyId');
    if (storyIdParam) {
      const id = parseInt(storyIdParam);
      setStoryId(id);
      loadStoryData(id);
    }
  }, [searchParams]);

  const loadStoryData = async (id: number) => {
    try {
      const [paras, count] = await Promise.all([
        getParagraphsAsync(id),
        getParagraphCountAsync(id)
      ]);
      setParagraphs(paras);
      setParagraphCount(count);
    } catch (err) {
      console.error('Error loading story data:', err);
    }
  };

  useEffect(() => {
    // Play intro audio on component mount
    const playIntroAudio = () => {
      const el = audioRef.current;
      if (!el) {
        // Retry if audio element not ready yet
        setTimeout(playIntroAudio, 100);
        return;
      }

      console.log('🎵 Setting up intro audio:', '/audios/level3/seviye-3-adim-1.mp3');
      el.src = '/audios/level3/seviye-3-adim-1.mp3';
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

  const instruction = 'Şimdi üçüncü seviyeye geçiyoruz. Bu seviyenin ilk basamağında ben metnimizi sesli bir şekilde paragraf paragraf model olarak okuyacağım. Benim güzel okuma kurallarını nasıl uyguladığıma dikkat et. Daha sonra da benim okumanı taklit ederek sen ikinci okumanı gerçekleştireceksin. Bu yüzden ben okurken sen de önündeki metinden beni dikkatli bir şekilde takip et. Bunu yaptığın zaman okuma becerilerin gelişecek. Hadi başlayalım.';

  const playModelAudio = async (paragraphNum: number): Promise<void> => {
    if (!storyId) return;
    
    return new Promise((resolve, reject) => {
      const el = audioRef.current;
      if (!el) {
        reject(new Error('Audio element not found'));
        return;
      }

      const audioPath = `/audios/story/${storyId}/story-${storyId}-paragraf-${paragraphNum}.mp3`;
      // Fallback to src/assets if not found in public
      el.src = audioPath;
      (el as any).playsInline = true;
      el.muted = false;
      // Apply playback rate
      el.playbackRate = getPlaybackRate();
      
      setIsPlayingModelAudio(true);
      
      el.onended = () => {
        setIsPlayingModelAudio(false);
        resolve();
      };
      
      el.onerror = () => {
        setIsPlayingModelAudio(false);
        console.warn(`Model audio not found: ${audioPath}, continuing...`);
        resolve(); // Continue even if audio file doesn't exist
      };
      
      el.play().catch((err) => {
        setIsPlayingModelAudio(false);
        console.warn(`Error playing model audio: ${audioPath}`, err);
        resolve(); // Continue even if play fails
      });
    });
  };

  const playSiraSendeAudio = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const el = audioRef.current;
      if (!el) {
        reject(new Error('Audio element not found'));
        return;
      }

      try {
        setIsPlayingSiraSende(true);
        el.src = '/audios/sira-sende-mikrofon.mp3';
        (el as any).playsInline = true;
        el.muted = false;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        
        el.onended = () => {
          setIsPlayingSiraSende(false);
          resolve();
        };
        
        el.onerror = () => {
          console.warn('Sıra sende audio not found, continuing...');
          setIsPlayingSiraSende(false);
          resolve(); // Continue even if audio doesn't exist
        };
        
        el.play().catch((err) => {
          console.warn('Error playing sira sende audio:', err);
          setIsPlayingSiraSende(false);
          resolve(); // Continue even if play fails
        });
      } catch (err) {
        console.warn('Error setting up sira sende audio:', err);
        setIsPlayingSiraSende(false);
        resolve(); // Continue even if setup fails
      }
    });
  };

  const playResponseAudio = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const el = audioRef.current;
      if (!el) {
        reject(new Error('Audio element not found'));
        return;
      }

      try {
        const audioData = `data:audio/mp3;base64,${audioBase64}`;
        el.src = audioData;
        (el as any).playsInline = true;
        el.muted = false;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        
        setIsPlayingResponse(true);
        
        el.onended = () => {
          setIsPlayingResponse(false);
          resolve();
        };
        
        el.onerror = () => {
          setIsPlayingResponse(false);
          reject(new Error('Error playing response audio'));
        };
        
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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:audio/...;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    if (!student || !storyId || currentParagraphIdx >= paragraphs.length) return;

    setIsProcessingResponse(true);
    setIsWaitingForRecording(false);
    setApiResponseText('');

    try {
      const paragraphText = paragraphToPlain(paragraphs[currentParagraphIdx]);
      const audioBase64 = await blobToBase64(audioBlob);
      
      let response;
      
      // First paragraph: use submitParagraphReading
      // Other paragraphs: use resumeUrl
      if (currentParagraphIdx === 0) {
        // Check if this is the last paragraph
        const isLatestParagraf = currentParagraphIdx === paragraphs.length - 1;

        // ⚠️ n8n workflow "studentId" alanını bekliyor
        // Değer olarak sessionId gönderiliyor (her session için unique)
        // Bu sayede aynı kullanıcının farklı hikayeleri karışmaz
        const requestData = {
          studentId: sessionId || `anon-${Date.now()}`,
          paragrafText: paragraphText,
          audioBase64: audioBase64,
          isLatestParagraf: isLatestParagraf,
          paragrafNo: currentParagraphIdx + 1, // 1-based index
        };

        // Log request without full audioBase64
        const requestForLog = {
          ...requestData,
          audioBase64: `${audioBase64.substring(0, 50)}... (${audioBase64.length} chars)`
        };

        console.log('📤 API Request Details:');
        console.log('  - Endpoint: POST /dost/level3/step1');
        console.log('  - Request Body:', JSON.stringify(requestForLog, null, 2));

        response = await submitParagraphReading(requestData);

        // Log response without full audioBase64
        const responseForLog = {
          ...response,
          audioBase64: response.audioBase64 ? `${response.audioBase64.substring(0, 50)}... (${response.audioBase64.length} chars)` : response.audioBase64
        };

        console.log('📥 API Response Details:');
        console.log('  - Endpoint: POST /dost/level3/step1');
        console.log('  - Response:', JSON.stringify(responseForLog, null, 2));
      } else {
        // Use resumeUrl for subsequent paragraphs (POST with same body as first request)
        if (!resumeUrl) {
          throw new Error('Resume URL not available');
        }
        
        // Check if this is the last paragraph
        const isLatestParagraf = currentParagraphIdx === paragraphs.length - 1;

        // ⚠️ n8n workflow "studentId" alanını bekliyor
        // Değer olarak sessionId gönderiliyor (her session için unique)
        // Bu sayede aynı kullanıcının farklı hikayeleri karışmaz
        const requestData = {
          studentId: sessionId || `anon-${Date.now()}`,
          paragrafText: paragraphText,
          audioBase64: audioBase64,
          isLatestParagraf: isLatestParagraf,
          paragrafNo: currentParagraphIdx + 1, // 1-based index
        };

        // Log request without full audioBase64
        const requestForLog = {
          ...requestData,
          audioBase64: `${audioBase64.substring(0, 50)}... (${audioBase64.length} chars)`
        };

        console.log('📤 API Request Details:');
        console.log('  - Endpoint: POST (resumeUrl)');
        console.log('  - URL:', resumeUrl);
        console.log('  - Request Body:', JSON.stringify(requestForLog, null, 2));

        response = await getResumeResponse(resumeUrl, requestData);

        // Log response without full audioBase64
        const responseForLog = {
          ...response,
          audioBase64: response.audioBase64 ? `${response.audioBase64.substring(0, 50)}... (${response.audioBase64.length} chars)` : response.audioBase64
        };

        console.log('📥 API Response Details:');
        console.log('  - Endpoint: POST (resumeUrl)');
        console.log('  - URL:', resumeUrl);
        console.log('  - Response:', JSON.stringify(responseForLog, null, 2));
      }
      
      // Update resumeUrl from response for next paragraphs
      if (response.resumeUrl) {
        setResumeUrl(response.resumeUrl);
      }

      // Show textAudio if available (optional)
      if (response.textAudio) {
        setApiResponseText(response.textAudio);
      }

      // Mark current paragraph as completed
      setCompletedParagraphs(prev => new Set([...prev, currentParagraphIdx]));

      // Play response audio if available
      if (response.audioBase64) {
        try {
          await playResponseAudio(response.audioBase64);
        } catch (err) {
          console.error('Error playing response audio:', err);
        }
      }

      // Move to next paragraph after response audio finishes
      if (currentParagraphIdx < paragraphs.length - 1) {
        const nextIdx = currentParagraphIdx + 1;
        setCurrentParagraphIdx(nextIdx);
        // Clear response text and reset states before moving to next paragraph
        setApiResponseText('');
        setIsProcessingResponse(false);
        setIsPlayingResponse(false);
        // Start next paragraph flow with explicit index
        setTimeout(() => {
          processNextParagraph(nextIdx);
        }, 500);
      } else {
        // All paragraphs completed
        setAllParagraphsCompleted(true);
        
        // Mark step as completed
        if (onStepCompleted) {
          await onStepCompleted({
            totalParagraphs: paragraphs.length,
            completedParagraphs: completedParagraphs.size + 1
          });
        }
      }
    } catch (err) {
      console.error('Error submitting paragraph reading:', err);
      // Simulate API response - continue as if API worked
      setApiResponseText('Harika okudun! Devam edelim.');
      
      // Mark current paragraph as completed even on error
      setCompletedParagraphs(prev => new Set([...prev, currentParagraphIdx]));

      // Move to next paragraph
      if (currentParagraphIdx < paragraphs.length - 1) {
        const nextIdx = currentParagraphIdx + 1;
        setCurrentParagraphIdx(nextIdx);
        // Start next paragraph flow with explicit index
        setTimeout(() => {
          processNextParagraph(nextIdx);
        }, 1000);
      } else {
        // All paragraphs completed
        setAllParagraphsCompleted(true);
        
        // Mark step as completed
        if (onStepCompleted) {
          await onStepCompleted({
            totalParagraphs: paragraphs.length,
            completedParagraphs: completedParagraphs.size + 1
          });
        }
      }
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const processNextParagraph = async (paragraphIdx?: number) => {
    const idx = paragraphIdx !== undefined ? paragraphIdx : currentParagraphIdx;
    
    if (idx >= paragraphs.length) {
      setAllParagraphsCompleted(true);
      return;
    }

    // Clear previous response text and reset states when moving to next paragraph
    setApiResponseText('');
    setIsWaitingForRecording(false);
    setIsProcessingResponse(false);
    setIsPlayingResponse(false);
    setIsPlayingSiraSende(false);

    // Play model audio for current paragraph
    setIsPlayingModelAudio(true);
    try {
      await playModelAudio(idx + 1);
    } catch (err) {
      console.error('Error playing model audio:', err);
    } finally {
      setIsPlayingModelAudio(false);
    }

    // Play "Şimdi sıra sende" audio
    try {
      await playSiraSendeAudio();
    } catch (err) {
      console.error('Error playing sira sende audio:', err);
    } finally {
      // Ensure isPlayingSiraSende is false after audio finishes
      setIsPlayingSiraSende(false);
    }

    // Wait for student recording (activate microphone after sira sende audio)
    setIsWaitingForRecording(true);
  };

  const startFlow = async () => {
    // Stop intro audio if still playing
    const el = audioRef.current;
    if (el && introAudioPlaying) {
      el.pause();
      el.currentTime = 0;
      setIntroAudioPlaying(false);
    }

    if (!storyId || paragraphs.length === 0) {
      alert('Hikaye yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    setStarted(true);
    setCurrentParagraphIdx(0);
    setAllParagraphsCompleted(false);
    setCompletedParagraphs(new Set()); // Reset completed paragraphs
    setResumeUrl(null); // Reset resumeUrl for new flow
    setApiResponseText(''); // Reset response text
    
    // Start first paragraph
    await processNextParagraph(0);
  };

  if (!storyId) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-8">
        <p className="text-red-600">Hikaye ID bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">1. Adım: Model okuma ve İkinci okuma</h2>
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
                  disabled={paragraphs.length === 0}
                >
                  Başla
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {started && (
        <div className="bg-white rounded-xl shadow p-5">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-purple-800">
                Paragraf {currentParagraphIdx + 1} / {paragraphs.length}
              </h3>
              {isPlayingModelAudio && (
                <span className="text-blue-600 font-semibold animate-pulse">🔊 DOST okuyor...</span>
              )}
              {isWaitingForRecording && (
                <span className="text-green-600 font-semibold animate-pulse">🎤 Sıra sende!</span>
              )}
              {isProcessingResponse && (
                <span className="text-orange-600 font-semibold">⏳ İşleniyor...</span>
              )}
              {isPlayingResponse && (
                <span className="text-purple-600 font-semibold animate-pulse">🔊 DOST yanıtlıyor...</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentParagraphIdx + 1) / paragraphs.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-gray-800 text-lg mb-4 relative" style={{ zIndex: 1 }}>
            {paragraphs.map((p, i) => {
              const isCurrent = i === currentParagraphIdx;
              const isCompleted = completedParagraphs.has(i);
              const isFuture = i > currentParagraphIdx && !isCompleted;
              
              let bgColor = '';
              let borderStyle = '';
              let padding = '';
              let borderRadius = '';
              let opacity = 1;
              let pointerEvents: 'auto' | 'none' = 'auto';
              let display: 'block' | 'none' = 'block';
              
              if (isCurrent) {
                bgColor = '#fff794'; // Warning yellow
                borderRadius = '0.5rem';
                padding = '0.5rem';
              } else if (isCompleted) {
                bgColor = '#d1fae5'; // Green background
                borderRadius = '0.5rem';
                padding = '0.5rem';
                borderStyle = 'border-l-4 border-green-500';
              } else if (isFuture) {
                // Future paragraphs: very faded and non-interactive, partially hidden
                opacity = 0.15;
                pointerEvents = 'none';
                // Don't hide completely, just make very faint
              }
              
              return (
                <div
                  key={i}
                  className={`mt-3 leading-relaxed relative ${borderStyle}`}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: borderRadius,
                    padding: padding,
                    opacity: opacity,
                    pointerEvents: pointerEvents,
                    display: display,
                    zIndex: 1,
                  }}
                >
                  {isCompleted && (
                    <div className="absolute left-2 top-2 text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className={isCompleted ? 'pl-8' : ''}>
                    {p.map((seg, j) => (
                      <span key={j} className={seg.bold ? 'font-bold' : undefined}>
                        {seg.text}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Microphone/Response Card - Always visible when started */}
          {(isPlayingModelAudio || isPlayingSiraSende || isWaitingForRecording || isProcessingResponse || isPlayingResponse || apiResponseText) && (
            <div className="sticky bottom-0 bg-white border-t-2 rounded-lg shadow-lg p-4 mt-6 z-50" 
                 style={{
                   borderColor: isPlayingModelAudio ? '#9CA3AF' : isPlayingSiraSende ? '#10B981' : isProcessingResponse || isPlayingResponse ? '#F59E0B' : apiResponseText ? '#3B82F6' : '#10B981'
                 }}>
              {isPlayingModelAudio && !apiResponseText && (
                <>
                  <p className="text-center mb-1 text-xl font-bold text-gray-500">
                    🔊 DOST paragrafı okuyor...
                  </p>
                  <div className="flex justify-center opacity-50 pointer-events-none">
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDuration()}
                      autoSubmit={true}
                      onSave={() => {}}
                      onPlayStart={() => {}}
                      storyId={storyId || 1}
                      level={3}
                      step={1}
                    />
                  </div>
                </>
              )}
              
              {isPlayingSiraSende && !apiResponseText && (
                <>
                  <p className="text-center mb-1 text-xl font-bold text-green-700">
                    🎤 Şimdi sıra sende! Mikrofona konuş
                  </p>
                  <div className="flex justify-center opacity-50 pointer-events-none">
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDuration()}
                      autoSubmit={true}
                      onSave={() => {}}
                      onPlayStart={() => {}}
                      storyId={storyId || 1}
                      level={3}
                      step={1}
                    />
                  </div>
                </>
              )}
              
              {isWaitingForRecording && !isProcessingResponse && !isPlayingResponse && !apiResponseText && !isPlayingSiraSende && (
                <>
                  <p className="text-center mb-1 text-xl font-bold text-green-700">
                    🎤 Şimdi sıra sende! Mikrofona konuş
                  </p>
                  <div className="flex justify-center">
                    <VoiceRecorder
                      recordingDurationMs={getRecordingDuration()}
                      autoSubmit={true}
                      onSave={handleVoiceSubmit}
                      onPlayStart={() => {
                        try {
                          window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
                        } catch {}
                      }}
                      storyId={storyId || 1}
                      level={3}
                      step={1}
                    />
                  </div>
                </>
              )}
              
              {(isProcessingResponse || isPlayingResponse) && !apiResponseText && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                    <p className="text-orange-600 font-semibold text-lg">
                      ⏳ DOST'tan cevap bekleniyor...
                    </p>
                  </div>
                </div>
              )}
              
              {apiResponseText && (
                <div>
                  <h4 className="font-bold text-blue-800 mb-2 text-center">🤖 DOST'un Yanıtı:</h4>
                  <p className="text-blue-700 text-center">{apiResponseText}</p>
                </div>
              )}
            </div>
          )}

          {allParagraphsCompleted && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-green-800 font-bold text-lg">
                ✅ Tüm paragraflar tamamlandı!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
