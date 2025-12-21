import { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { submitReadingAnalysis } from '../../lib/level2-api';
import { getParagraphs } from '../../data/stories';
import { setAnalysisResult } from '../../store/level2Slice';
import { getAppMode } from '../../lib/api';
import type { Level2Step1ReadingAnalysisResponse } from '../../types';
import type { RootState, AppDispatch } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

const STORY_ID = 2;
const TOTAL_SECONDS = 60;

// Turkish translations for quality metrics
const QUALITY_METRIC_LABELS: Record<string, string> = {
  speechRate: 'Okuma Hızı',
  correctWords: 'Doğru Sözcükler',
  punctuation: 'Noktalama',
  expressiveness: 'İfadeli Okuma',
};

const getApiEnv = () => {
  return localStorage.getItem('api_env') || 'production';
};

export default function Level2Step1() {
  const story = { id: STORY_ID, title: 'Avucumun İçindeki Akıllı Kutu' };
  const storyText = getParagraphs(story.id)
    .map(p => p.map(seg => seg.text).join(''))
    .join(' ');

  const currentStudent = useSelector((state: RootState) => state.user.student);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sessionId, onStepCompleted } = useStepContext();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs to prevent stale closure in timer
  const selectedWordIndexRef = useRef<number | null>(null);
  const handleFinishRef = useRef<(() => Promise<void>) | null>(null);
  
  // Guard against double execution (timeout + user click)
  const finishOnceRef = useRef<boolean>(false);
  
  // Store supported MIME type
  const recordingMimeTypeRef = useRef<string>('audio/webm');

  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const [started, setStarted] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<null | { wordsRead: number; wpm: number; wordsPerSecond: number }>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<Level2Step1ReadingAnalysisResponse | null>(null);
  const [countdownStartTime, setCountdownStartTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedWordIndexRef.current = selectedWordIndex;
  }, [selectedWordIndex]);
  const [timeUp, setTimeUp] = useState(false);
  const [beeped60, setBeeped60] = useState(false);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);

  const paragraphs = getParagraphs(story.id);
  const displayTitle = story.title;
  const appMode = getAppMode();

  // Play intro audio on component mount
  useEffect(() => {
    const playIntroAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.src = '/src/assets/audios/level2/seviye-2-adim-1.mp3';
          // Apply playback rate
          audioRef.current.playbackRate = getPlaybackRate();
          audioRef.current.play().then(() => {
            audioRef.current!.addEventListener('ended', () => {
              setIntroAudioPlaying(false);
            }, { once: true });
          }).catch(() => {
            // If autoplay fails, show the button anyway
            setIntroAudioPlaying(false);
          });
        }
      } catch (err) {
        console.error('Error playing intro audio:', err);
        setIntroAudioPlaying(false);
      }
    };

    playIntroAudio();

    const stopAll = () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);

    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
    };
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data:audio/...;base64, prefix to get just the base64 string
        const base64String = base64.split(',')[1] || base64;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const playBeep = async () => {
    return new Promise<void>((resolve) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000; // 1000Hz beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      setTimeout(resolve, 100);
    });
  };

  const handleStart = async () => {
    // Reset all states for clean restart
    setTimeUp(false);
    setBeeped60(false);
    setTimeLeft(TOTAL_SECONDS);
    setSelectedWordIndex(null);
    audioChunksRef.current = [];
    finishOnceRef.current = false;
    
    // In dev mode, always stop audio. In prod mode, only if playing
    if (audioRef.current && (appMode === 'dev' || introAudioPlaying)) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIntroAudioPlaying(false);
    }
    // Play beep first
    try {
      await playBeep();
    } catch (err) {
      console.error('Error playing beep:', err);
    }

    setStarted(true);
    setReading(true);
    setCountdownStartTime(Date.now());
    setRecordingStartTime(new Date().toISOString());

    // Start audio recording with MIME type fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Find supported MIME type
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];
      const supportedType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t));
      recordingMimeTypeRef.current = supportedType || 'audio/webm';

      const mediaRecorder = new MediaRecorder(
        stream,
        supportedType ? { mimeType: supportedType } : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  useEffect(() => {
    if (!reading) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setTimeLeft(remaining);

      if (remaining === 60 && !beeped60) {
        setBeeped60(true);
      }

      if (remaining === 0) {
        setTimeUp(true);
        // Use ref to avoid stale closure
        handleFinishRef.current?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [reading, countdownStartTime, beeped60]);

  const handleFinish = async () => {
    // Prevent double execution (timeout + user click race)
    if (finishOnceRef.current) {
      return;
    }
    finishOnceRef.current = true;

    setReading(false);
    setIsProcessing(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const rec = mediaRecorderRef.current;
      
      // Request final chunk before stopping
      if (typeof rec.requestData === 'function') {
        try {
          rec.requestData();
        } catch (e) {
          // Ignore if requestData fails
        }
      }
      
      // Use onstop handler for reliable final chunk capture
      await new Promise<void>((resolve) => {
        rec.onstop = () => resolve();
        rec.stop();
      });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      // Get MIME type extension for filename
      const mimeToExt = (mime: string): string => {
        if (mime.includes('webm')) return 'webm';
        if (mime.includes('ogg')) return 'ogg';
        if (mime.includes('wav')) return 'wav';
        if (mime.includes('mpeg')) return 'mp3';
        if (mime.includes('mp4')) return 'm4a';
        return 'webm';
      };

      const finalMime = recordingMimeTypeRef.current || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
      const base64Audio = await blobToBase64(audioBlob);
      
      // Fix elapsed=0 bug: use safeElapsed to prevent division by zero
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const safeElapsed = Math.max(1, elapsed);
      const wordsRead = Math.ceil((storyText.split(/\s+/).length * elapsed) / TOTAL_SECONDS);
      const wpm = Math.ceil((wordsRead / safeElapsed) * 60);

      // Use current ref value to avoid stale state
      const currentSelectedIndex = selectedWordIndexRef.current;

      // Send with correct field names expected by n8n backend
      const payload = {
        // Primary: sessionId for n8n tracking (prevents story mixing)
        sessionId: sessionId || `anon-${Date.now()}`,
        // Backward compat: also send studentId during transition
        studentId: currentStudent?.id || 'anonymous',
        textTitle: story.title,
        originalText: storyText,
        startTime: recordingStartTime,
        endTime: new Date().toISOString(),
        // New audio object with metadata for n8n
        audio: {
          base64: base64Audio,
          mimeType: finalMime,
          fileName: `recording.${mimeToExt(finalMime)}`
        },
        // Keep audioBase64 for backward compatibility
        audioBase64: base64Audio,
        selectedWordCount: currentSelectedIndex !== null ? currentSelectedIndex + 1 : wordsRead,
      };

      setIsUploading(true);
      const response = await submitReadingAnalysis(payload) as Level2Step1ReadingAnalysisResponse;

      setResult({ wordsRead, wpm, wordsPerSecond: wpm / 60 });

      if (getApiEnv() === 'test') {
        console.log('Step1 Analysis Response:', response);
      }

      setAnalysis(response);

      // Mark step as completed
      if (onStepCompleted) {
        await onStepCompleted({
          wordsRead,
          wpm,
          wordsPerSecond: wpm / 60,
          analysis: response
        });
      }
    } catch (error) {
      console.error('Error during recording or upload:', error);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  // Keep handleFinishRef in sync with latest handleFinish
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  const CountdownBadge = ({ secondsLeft, total }: { secondsLeft: number; total: number }) => {
    const size = 64;
    const stroke = 6;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(1 - secondsLeft / total, 0), 1);
    const dashOffset = circumference * progress;
    const color = progress < 0.5 ? '#22c55e' : progress < 0.85 ? '#f59e0b' : '#ef4444';
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg width={size} height={size} className="absolute">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
          <g style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%' }}>
            <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </g>
        </svg>
        <div className="relative text-center font-bold text-sm text-gray-800">{secondsLeft}</div>
      </div>
    );
  };

  const introText = 'Şimdi ikinci seviyeye geçiyoruz. Bu seviyede metni ilk kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basarsanız metin karşına çıkacak sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde oku.';

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      
      {/* Start screen */}
      {!started && !reading && !result && (
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">1. Adım: Birinci okuma ve Okuma hızı belirleme</h2>
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <p className="text-gray-800 text-lg">{introText}</p>
          </div>
          <div className="flex justify-center">
            {appMode === 'prod' && introAudioPlaying ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                <p className="text-gray-600">Ses çalınıyor...</p>
              </div>
            ) : (
              <button onClick={handleStart} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
            )}
          </div>
        </div>
      )}

      {/* Reading screen */}
      {reading && (
        <div className="w-full relative">
          {isProcessing && (
            <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 rounded-xl">
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-xl font-semibold text-gray-700">Okuma süresi ölçülüyor...</p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-0">
            {/* Left sticky image */}
            <div className="hidden lg:sticky lg:top-0 lg:w-1/4 lg:flex flex-col items-center justify-start p-4 h-screen overflow-y-auto flex-shrink-0">
              <img src="https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story2.png" alt={displayTitle} className="w-full max-w-xs rounded-xl shadow-lg" />
              <h2 className="mt-4 text-2xl font-bold text-purple-800 text-center">{displayTitle}</h2>
            </div>

            {/* Center text */}
            <div className="flex-1 bg-white shadow p-6 leading-relaxed text-gray-800">
              <div className={`text-lg leading-relaxed space-y-4 ${timeUp || isProcessing ? 'blur-sm' : ''}`}>
                {(() => {
                  let globalIndex = -1;
                  return paragraphs.map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.map((seg, sIdx) => {
                        const words = seg.text.split(/\s+/).filter(Boolean);
                        return (
                          <span key={sIdx} className={seg.bold ? 'font-bold' : ''}>
                            {words.map((w, wIdx) => {
                              globalIndex += 1;
                              const idx = globalIndex;
                              return (
                                <span
                                  key={wIdx}
                                  onClick={() => setSelectedWordIndex(idx)}
                                  className={`cursor-pointer px-0.5 ${selectedWordIndex === idx ? 'bg-yellow-300 rounded' : ''}`}
                                >
                                  {w}{' '}
                                </span>
                              );
                            })}
                          </span>
                        );
                      })}
                    </p>
                  ));
                })()}
              </div>
              {timeUp && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/70 rounded-xl"></div>
                  <div className="relative text-red-600 text-2xl font-extrabold animate-bounce">Süre doldu</div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                {!isProcessing && (
                  <button onClick={handleFinish} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow">Bitir</button>
                )}
              </div>
            </div>
          </div>

          {/* Right fixed countdown */}
          {!isProcessing && (
            <div className="hidden lg:flex fixed right-8 top-20 flex-col items-center justify-start p-4 bg-white rounded-lg shadow z-40">
              <CountdownBadge secondsLeft={timeLeft} total={TOTAL_SECONDS} />
              <div className="text-center text-gray-600 text-sm mt-2">Kalan Süre</div>
            </div>
          )}
        </div>
      )}

      {/* Result screen */}
      {(result || isProcessing || isUploading || analysis) && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            {isProcessing && (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Okuma süresi ölçülüyor...</p>
              </div>
            )}

            {!isProcessing && isUploading && <p className="text-gray-600">Analiz yapılıyor...</p>}
            {!isProcessing && analysis && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 text-center max-w-2xl">
                  <h4 className="font-bold text-green-900 mb-2 text-xl">✅ Okuma Tamamlandı!</h4>
                  <p className="text-gray-700 mb-4">Sonuçlarını görmek için devam et butonuna tıkla.</p>
                  <button
                    onClick={() => {
                      console.log('Devam Et clicked. Full analysis response:', analysis);
                      
                      // ✅ Simplified parse - only use response.output
                      const out = (analysis as any)?.output;
                      
                      if (!out) {
                        console.error('No output found in response:', analysis);
                        alert('Analiz verisi bulunamadı. Lütfen tekrar deneyin.');
                        return;
                      }
                      
                      const analysisData = out.analysis || {};
                      
                      console.log('Extracted output:', out);
                      console.log('Extracted analysis:', analysisData);
                      
                      // Redux store format - standardized structure
                      const resultData = {
                        transcript: out.transcript || '',
                        
                        readingSpeed: {
                          wordsPerMinute: analysisData.wordsPerMinute || 0,
                          correctWordsPerMinute: analysisData.correctWordsPerMinute || 0,
                        },
                        
                        wordCount: {
                          original: analysisData.originalWordCount || 0,
                          spoken: analysisData.spokenWordCount || 0,
                          correct: analysisData.correctWordCount || 0,
                        },
                        
                        pronunciation: {
                          accuracy: analysisData.pronunciationAccuracy || 0,
                          errors: analysisData.errors || [],
                        },
                        
                        // Quality scores from output root (NOT from inside analysis)
                        qualityRules: {
                          speechRate: out.speechRate || { score: 0, feedback: '' },
                          correctWords: out.correctWords || { score: 0, feedback: '' },
                          punctuation: out.punctuation || { score: 0, feedback: '' },
                          expressiveness: out.expressiveness || { score: 0, feedback: '' },
                        },
                        
                        overallScore: out.overallScore ?? analysisData.wordsPerMinute ?? 0,
                        recommendations: out.recommendations || [],
                      };
                      
                      console.log('Step1: Dispatching analysis result:', resultData);
                      dispatch(setAnalysisResult(resultData));
                      
                      setTimeout(() => {
                        navigate('/level/2/step/2');
                      }, 100);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
                  >
                    Devam Et →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
