import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getParagraphs, paragraphToPlain } from '../../data/stories';
import { insertReadingLog, getLatestReadingGoal } from '../../lib/supabase';
import type { RootState } from '../../store/store';
import { getAppMode } from '../../lib/api';
import { useStepContext } from '../../contexts/StepContext';
import { getStoryImageUrl } from '../../lib/image-utils';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { submitReadingSpeedAnalysis } from '../../lib/level3-api';
import { setStep2Analysis } from '../../store/level3Slice';
import type { Level3Step2AnalysisResult } from '../../store/level3Slice';
import { TestTube } from 'lucide-react';
import { getTestAudioBlob } from '../../components/TestAudioManager';

function countWords(text: string) {
  const m = text.trim().match(/\b\w+\b/gu);
  return m ? m.length : 0;
}

export default function L3Step2() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const { sessionId, storyId, onStepCompleted } = useStepContext();

  // Story image dosyası dinamik olarak belirlenir (prod ve lokal için çalışır)
  const storyImage = getStoryImageUrl(`/images/story${storyId}.png`);
  const story = { id: storyId, title: '', image: storyImage };
  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const fullText = useMemo(() => paragraphs.map(p => paragraphToPlain(p)).join(' '), [paragraphs]);
  const totalWords = useMemo(() => countWords(fullText), [fullText]);

  const [targetWPM, setTargetWPM] = useState<number>(80);
  const [phase, setPhase] = useState<'intro'|'countdown'|'reading'|'analyzing'|'done'>('intro');
  const [count, setCount] = useState(3);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [introAudioPlayed, setIntroAudioPlayed] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Microphone recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 dakika - paragrafın tamamını okuma için
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null);
  
  // Analysis result state
  const [analysisResult, setAnalysisResultLocal] = useState<Level3Step2AnalysisResult | null>(null);
  
  // Refs to prevent stale closure and race conditions
  const recordingMimeTypeRef = useRef<string>('audio/webm');
  const finishOnceRef = useRef<boolean>(false);
  const handleFinishRef = useRef<(() => Promise<void>) | null>(null);
  const storyIdRef = useRef(storyId);
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);
  const [introAudioEnded, setIntroAudioEnded] = useState(false);
  const [testAudioActive, setTestAudioActive] = useState(false);
  const appMode = getAppMode();

  // Test audio aktif mi kontrol et
  useEffect(() => {
    const checkTestAudio = () => {
      const globalEnabled = localStorage.getItem('use_test_audio_global') === 'true';
      setTestAudioActive(globalEnabled);
    };

    checkTestAudio();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'use_test_audio_global') {
        checkTestAudio();
      }
    };

    const handleCustomEvent = () => {
      checkTestAudio();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('testAudioChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testAudioChanged', handleCustomEvent);
    };
  }, []);

  // Load target WPM from Supabase (from Level 2 reading goal)
  useEffect(() => {
    if (!student) return;
    
    const loadTargetWPM = async () => {
      try {
        const goal = await getLatestReadingGoal(student.id, storyId, 2);
        if (goal) {
          setTargetWPM(goal);
        }
      } catch (err) {
        console.error('Error loading reading goal:', err);
      }
    };

    loadTargetWPM();
  }, [student?.id, storyId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Cleanup microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!introAudioPlayed && phase === 'intro' && audioRef.current) {
      const playIntroAudio = async () => {
        try {
          audioRef.current!.src = '/audios/level3/seviye-3-adim-2.mp3';
          audioRef.current!.playbackRate = getPlaybackRate();
          // @ts-ignore
          audioRef.current.playsInline = true;
          audioRef.current.muted = false;
          
          // Listen for audio end
          const handleEnded = () => {
            setIntroAudioEnded(true);
            setIsAudioPlaying(false);
          };
          audioRef.current.addEventListener('ended', handleEnded, { once: true });
          
          // Listen for audio play
          const handlePlay = () => {
            setIsAudioPlaying(true);
          };
          audioRef.current.addEventListener('play', handlePlay, { once: true });
          
          await audioRef.current.play();
          setIntroAudioPlayed(true);
        } catch (err) {
          console.error('Failed to play intro audio:', err);
          setIntroAudioPlayed(true);
          setIntroAudioEnded(true);
        }
      };
      playIntroAudio();
    }
  }, [introAudioPlayed, phase]);


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

  const startCountdown = async () => {
    // Stop intro audio if still playing
    if (audioRef.current && isAudioPlaying && phase === 'intro') {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
      setIntroAudioEnded(true);
    }
    
    // Test audio aktifse, mikrofon açmadan direkt hazır sesi kullan
    if (testAudioActive) {
      console.log('🧪 Test modu aktif - hazır ses kullanılacak (Level 3 Step 2)');
      
      try {
        const testBlob = await getTestAudioBlob(storyId, 3, 2);
        
        if (testBlob) {
          console.log('✅ Test audio bulundu, analiz başlatılıyor...');
          
          // Analiz yapılıyor göster
          setPhase('analyzing');
          
          // Reset guards for new recording
          finishOnceRef.current = false;
          startTimeRef.current = Date.now();
          
          // Test audio'yu base64'e çevir
          const base64Audio = await blobToBase64(testBlob);
          const mimeType = testBlob.type || 'audio/webm';
          const elapsedMs = 60000; // Test için 60 saniye varsayılan
          const elapsedSec = 60;
          const wpm = Math.round((totalWords / elapsedSec) * 60);
          
          // API'ye gönder
          const rawResponse = await submitReadingSpeedAnalysis({
            userId: sessionId || `anon-${Date.now()}`,
            audioFile: testBlob,
            durationMs: elapsedMs,
            hedefOkuma: targetWPM,
            metin: fullText,
            startTime: new Date(startTimeRef.current).toISOString(),
            endTime: new Date().toISOString(),
            mimeType: mimeType,
            fileName: `test-recording.webm`,
          });
          
          console.log('✅ Test audio analiz yanıtı:', rawResponse);
          
          // API yanıtını Level3Step2AnalysisResult formatına dönüştür
          const apiResponse = rawResponse as any;
          
          const testResult: Level3Step2AnalysisResult = {
            speedSummary: apiResponse.speedSummary || '',
            hedefOkuma: apiResponse.hedefOkuma || targetWPM,
            reachedTarget: apiResponse.reachedTarget || false,
            analysisText: apiResponse.analysisText || '',
            metrics: {
              durationSec: apiResponse.metrics?.durationSec || elapsedSec,
              durationMMSS: apiResponse.metrics?.durationMMSS || '1:00',
              targetWordCount: apiResponse.metrics?.targetWordCount || totalWords,
              spokenWordCount: apiResponse.metrics?.spokenWordCount || 0,
              matchedWordCount: apiResponse.metrics?.matchedWordCount || 0,
              accuracyPercent: apiResponse.metrics?.accuracyPercent || 0,
              wpmSpoken: apiResponse.metrics?.wpmSpoken || wpm,
              wpmCorrect: apiResponse.metrics?.wpmCorrect || 0,
            },
            coachText: apiResponse.coachText || '',
            audioBase64: apiResponse.audioBase64,
            transcriptText: apiResponse.transcriptText || '',
            resumeUrl: apiResponse.resumeUrl,
          };

          // Redux'a kaydet
          dispatch(setStep2Analysis(testResult));
          
          // Local state'e kaydet
          setAnalysisResultLocal(testResult);
          
          if (student) {
            const progressDelta = (testResult.metrics.wpmCorrect || wpm) - targetWPM;
            await insertReadingLog(student.id, storyId, 3, testResult.metrics.wpmCorrect || wpm, totalWords, testResult.metrics.matchedWordCount || 0);
            
            if (onStepCompleted) {
              await onStepCompleted({
                totalWords,
                elapsedSec,
                wpm: testResult.metrics.wpmCorrect || wpm,
                targetWPM,
                analysis: testResult,
                progressDelta,
              });
            }
          }
          
          // Done fazına geç
          setPhase('done');
          
          return; // Mikrofon açmadan çık
        } else {
          console.warn('⚠️ Test audio bulunamadı, normal akışa devam ediliyor');
        }
      } catch (err) {
        console.error('❌ Test audio işleme hatası:', err);
      }
    }
    
    setPhase('countdown');
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          startReading();
        }
        return c - 1;
      });
    }, 1000);
  };

  const startReading = async () => {
    // Play beep first
    try {
      await playBeep();
    } catch (err) {
      console.error('Error playing beep:', err);
    }

    // Reset guards for new recording
    finishOnceRef.current = false;
    
    setPhase('reading');
    startTimeRef.current = Date.now();
    setCountdownStartTime(Date.now());
    setRecordingStartTime(Date.now());
    setTimeLeft(180); // Reset timer

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
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (phase !== 'reading' || !countdownStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed); // 3 minutes
      setTimeLeft(remaining);

      if (remaining === 0) {
        // Use ref to avoid stale closure
        handleFinishRef.current?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, countdownStartTime]);

  const handleFinish = async () => {
    // Prevent double execution (timeout + user click race)
    if (finishOnceRef.current) {
      return;
    }
    finishOnceRef.current = true;

    if (!startTimeRef.current || !student) return;

    setIsRecording(false);
    setPhase('analyzing'); // Analiz yapılıyor göster

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Stop recording with reliable final chunk capture
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

    // Calculate elapsed time with 0 protection
    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSec = Math.max(0.1, elapsedMs / 1000); // Prevent division by zero
    const wpm = Math.round((totalWords / elapsedSec) * 60);

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
      
      console.log('🎤 Sending audio to n8n for analysis:', {
        userId: sessionId,
        audioSize: audioBlob.size,
        mimeType: finalMime,
        duration: elapsedMs,
        targetWPM,
      });

      // Send to n8n with metadata
      // ⚠️ n8n workflow "userId" alanını bekliyor
      // Değer olarak sessionId gönderiliyor (her session için unique)
      // Bu sayede aynı kullanıcının farklı hikayeleri karışmaz
      const rawResponse = await submitReadingSpeedAnalysis({
        userId: sessionId || `anon-${Date.now()}`,
        audioFile: audioBlob,
        durationMs: Math.round(elapsedMs),
        hedefOkuma: targetWPM,
        metin: fullText,
        startTime: new Date(startTimeRef.current).toISOString(),
        endTime: new Date().toISOString(),
        mimeType: finalMime,
        fileName: `recording.${mimeToExt(finalMime)}`,
      });

      console.log('✅ Received raw analysis from n8n:', rawResponse);

      // API yanıtını Level3Step2AnalysisResult formatına dönüştür
      const apiResponse = rawResponse as any;
      
      const result: Level3Step2AnalysisResult = {
        speedSummary: apiResponse.speedSummary || '',
        hedefOkuma: apiResponse.hedefOkuma || targetWPM,
        reachedTarget: apiResponse.reachedTarget || false,
        analysisText: apiResponse.analysisText || '',
        metrics: {
          durationSec: apiResponse.metrics?.durationSec || elapsedSec,
          durationMMSS: apiResponse.metrics?.durationMMSS || `${Math.floor(elapsedSec / 60)}:${Math.floor(elapsedSec % 60).toString().padStart(2, '0')}`,
          targetWordCount: apiResponse.metrics?.targetWordCount || totalWords,
          spokenWordCount: apiResponse.metrics?.spokenWordCount || 0,
          matchedWordCount: apiResponse.metrics?.matchedWordCount || 0,
          accuracyPercent: apiResponse.metrics?.accuracyPercent || 0,
          wpmSpoken: apiResponse.metrics?.wpmSpoken || wpm,
          wpmCorrect: apiResponse.metrics?.wpmCorrect || 0,
        },
        coachText: apiResponse.coachText || '',
        audioBase64: apiResponse.audioBase64,
        transcriptText: apiResponse.transcriptText || '',
        resumeUrl: apiResponse.resumeUrl,
      };

      console.log('📊 Parsed analysis result:', result);

      // Redux'a kaydet - Step3 bu veriyi kullanacak
      dispatch(setStep2Analysis(result));
      
      // Local state'e kaydet - done sayfasında göstermek için
      setAnalysisResultLocal(result);

      // Calculate progress delta
      const progressDelta = (result.metrics.wpmCorrect || wpm) - targetWPM;

      // Save reading log to Supabase
      await insertReadingLog(student.id, storyId, 3, result.metrics.wpmCorrect || wpm, totalWords, result.metrics.matchedWordCount || 0);

      // Mark step as completed with full analysis
      if (onStepCompleted) {
        await onStepCompleted({
          totalWords,
          elapsedSec,
          wpm: result.metrics.wpmCorrect || wpm,
          targetWPM,
          analysis: result,
          progressDelta,
        });
      }
      
      setPhase('done');
    } catch (err) {
      console.error('Failed to save reading data or get analysis:', err);
      setPhase('done'); // Hata olsa bile done'a geç
    }
  };

  // Keep handleFinishRef in sync with latest handleFinish
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  const finishReading = handleFinish;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">2. Adım: Üçüncü okuma ve okuma hızı belirleme</h2>
      </div>

      {phase === 'intro' && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl shadow p-5 w-full">
            <p className="text-gray-800 mb-6">Şimdi hedefine ulaşıp ulaşmadığını değerlendirmek için metni üçüncü kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni yine bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basar basmaz metin karşına çıkacak sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde metni oku. Okuman bitince "Bitir" butonuna bas.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            {testAudioActive && (
              <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                <span>🧪 Test modu: Hazır ses kullanılacak</span>
              </div>
            )}
            
            {(appMode === 'dev' || introAudioEnded || !isAudioPlaying) && (
              <button 
                onClick={startCountdown} 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Başla
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="text-center bg-white rounded-xl shadow p-10 text-6xl font-bold text-purple-700">{count}</div>
      )}

      {phase === 'reading' && (
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <img src={story.image} alt={story.title} className="rounded-xl shadow w-48 md:w-64" />
          <div className="bg-white rounded-xl shadow p-5 flex-1">
            {/* Recording status and timer */}
            <div className="mb-4 space-y-2">
              {isRecording && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-800 font-semibold">
                      🎤 Kayıt yapılıyor...
                    </p>
                    <div className="text-2xl font-bold text-red-600 tabular-nums">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-lg text-gray-800 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i} className="mt-3">
                  {p.map((seg, j) => (
                    <span key={j} className={seg.bold ? 'font-bold' : undefined}>
                      {seg.text}{' '}
                    </span>
                  ))}
                </p>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={finishReading} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded">Bitir</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Okuma sonucu analiz ediliyor...</p>
            <p className="text-sm text-gray-500 mt-2">Lütfen bekleyin</p>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            {analysisResult ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 text-center max-w-2xl w-full">
                  <h4 className="font-bold text-green-900 mb-2 text-xl">✅ Okuma Tamamlandı!</h4>
                  <p className="text-gray-700 mb-4">Sonuçlarını görmek için devam et butonuna tıkla.</p>
                  <button
                    onClick={() => {
                      navigate(`/level/3/step/3?storyId=${storyId}`);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
                  >
                    Sonuçları Gör →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center">
                <h4 className="font-bold text-yellow-900 mb-2 text-xl">⚠️ Analiz tamamlanamadı</h4>
                <p className="text-gray-700 mb-4">Bir hata oluştu. Lütfen tekrar deneyin.</p>
                <button
                  onClick={() => {
                    finishOnceRef.current = false;
                    setPhase('intro');
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
                >
                  Tekrar Dene
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
