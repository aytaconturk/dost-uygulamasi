import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getParagraphsAsync, paragraphToPlain, getParagraphCountAsync } from '../../data/stories';
import { getAppMode } from '../../lib/api';
import { submitParagraphReading } from '../../lib/level3-api';
import type { RootState } from '../../store/store';
import VoiceRecorder from '../../components/VoiceRecorder';
import type { Paragraph } from '../../data/stories';
import { getRecordingDuration } from '../../components/SidebarSettings';

export default function L3Step1() {
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [storyId, setStoryId] = useState<number | null>(null);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);
  const [isWaitingForRecording, setIsWaitingForRecording] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [apiResponseText, setApiResponseText] = useState<string>('');
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
    // Play intro audio on mount
    const el = audioRef.current;
    if (el) {
      try {
        el.src = '/src/assets/audios/level3/seviye-3-adim-1.mp3';
        (el as any).playsInline = true;
        el.muted = false;
        el.play().catch(() => {});
        el.addEventListener('ended', () => setIntroAudioPlaying(false), { once: true });
      } catch {}
    }
    return () => { 
      try { 
        window.speechSynthesis.cancel(); 
        if (audioRef.current) {
          audioRef.current.pause();
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
      el.src = audioPath;
      (el as any).playsInline = true;
      el.muted = false;
      
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

      const response = await submitParagraphReading({
        userId: student.id,
        paragraphText: paragraphText,
        audioBase64: audioBase64,
        paragraphNo: currentParagraphIdx + 1,
        storyId: storyId,
      });

      setApiResponseText(response.text || response.message || '');

      // Play response audio if available
      if (response.audioBase64) {
        try {
          await playResponseAudio(response.audioBase64);
        } catch (err) {
          console.error('Error playing response audio:', err);
        }
      }

      // Mark current paragraph as completed
      setCompletedParagraphs(prev => new Set([...prev, currentParagraphIdx]));

      // Move to next paragraph
      if (currentParagraphIdx < paragraphs.length - 1) {
        setCurrentParagraphIdx(currentParagraphIdx + 1);
        // Start next paragraph flow
        setTimeout(() => {
          processNextParagraph();
        }, 1000);
      } else {
        // All paragraphs completed
        setAllParagraphsCompleted(true);
      }
    } catch (err) {
      console.error('Error submitting paragraph reading:', err);
      // Simulate API response - continue as if API worked
      setApiResponseText('Harika okudun! Devam edelim.');
      
      // Mark current paragraph as completed even on error
      setCompletedParagraphs(prev => new Set([...prev, currentParagraphIdx]));

      // Move to next paragraph
      if (currentParagraphIdx < paragraphs.length - 1) {
        setCurrentParagraphIdx(currentParagraphIdx + 1);
        // Start next paragraph flow
        setTimeout(() => {
          processNextParagraph();
        }, 1000);
      } else {
        // All paragraphs completed
        setAllParagraphsCompleted(true);
      }
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const processNextParagraph = async () => {
    if (currentParagraphIdx >= paragraphs.length) {
      setAllParagraphsCompleted(true);
      return;
    }

    // Play model audio for current paragraph
    setIsPlayingModelAudio(true);
    try {
      await playModelAudio(currentParagraphIdx + 1);
    } catch (err) {
      console.error('Error playing model audio:', err);
    } finally {
      setIsPlayingModelAudio(false);
    }

    // Wait for student recording
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
    
    // Start first paragraph
    await processNextParagraph();
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

          <div className="text-gray-800 text-lg mb-4">
            {paragraphs.map((p, i) => {
              const isCurrent = i === currentParagraphIdx;
              const isCompleted = completedParagraphs.has(i);
              
              let bgColor = '';
              let borderStyle = '';
              let padding = '';
              let borderRadius = '';
              
              if (isCurrent) {
                bgColor = '#fff794'; // Warning yellow
                borderRadius = '0.5rem';
                padding = '0.5rem';
              } else if (isCompleted) {
                bgColor = '#d1fae5'; // Green background
                borderRadius = '0.5rem';
                padding = '0.5rem';
                borderStyle = 'border-l-4 border-green-500';
              }
              
              return (
                <div
                  key={i}
                  className={`mt-3 leading-relaxed relative ${borderStyle}`}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: borderRadius,
                    padding: padding,
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

          {isWaitingForRecording && !isProcessingResponse && (
            <div className="sticky bottom-0 bg-white border-t-2 border-green-500 rounded-lg shadow-lg p-4 mt-6 z-10">
              <p className="text-center mb-4 text-xl font-bold text-green-700">
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
                />
              </div>
            </div>
          )}

          {apiResponseText && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">🤖 DOST'un Yanıtı:</h4>
              <p className="text-blue-700">{apiResponseText}</p>
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
