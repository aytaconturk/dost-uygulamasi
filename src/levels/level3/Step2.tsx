import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getParagraphs, paragraphToPlain } from '../../data/stories';
import { insertReadingLog, getLatestReadingGoal } from '../../lib/supabase';
import type { RootState } from '../../store/store';
import { getAppMode } from '../../lib/api';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

function countWords(text: string) {
  const m = text.trim().match(/\b\w+\b/gu);
  return m ? m.length : 0;
}

export default function L3Step2() {
  const student = useSelector((state: RootState) => state.user.student);
  const { sessionId, storyId, onStepCompleted } = useStepContext();

  const story = { id: storyId, title: 'Çöl Şekerlemesi', image: '/src/assets/images/story3.png' };
  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const fullText = useMemo(() => paragraphs.map(p => paragraphToPlain(p)).join(' '), [paragraphs]);
  const totalWords = useMemo(() => countWords(fullText), [fullText]);
  const words = useMemo(() => fullText.split(/\s+/).filter(w => w.length > 0), [fullText]);

  const [targetWPM, setTargetWPM] = useState<number>(80);
  const [phase, setPhase] = useState<'intro'|'countdown'|'reading'|'done'>('intro');
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
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes default
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null);
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);
  const [audioDuration, setAudioDuration] = useState(0);
  const [highlightedWordIdx, setHighlightedWordIdx] = useState<number | null>(null);
  const [introAudioEnded, setIntroAudioEnded] = useState(false);
  const appMode = getAppMode();

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

    setPhase('reading');
    startTimeRef.current = Date.now();
    setCountdownStartTime(Date.now());
    setRecordingStartTime(Date.now());
    setTimeLeft(180); // Reset timer

    // Start audio recording automatically
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

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

    // Start audio with highlight
    startAudioWithHighlight();
  };

  const startAudioWithHighlight = async () => {
    const el = audioRef.current;
    if (!el) return;

    try {
      el.src = '/audios/level3/seviye-3-adim-2.mp3';
      // Apply playback rate
      el.playbackRate = getPlaybackRate();
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;

      // Wait for metadata to get duration
      el.addEventListener('loadedmetadata', () => {
        setAudioDuration(el.duration);
      }, { once: true });

      el.addEventListener('play', () => setIsAudioPlaying(true));
      el.addEventListener('pause', () => setIsAudioPlaying(false));
      el.addEventListener('ended', () => setIsAudioPlaying(false));

      // Sync highlighting with audio playback
      const handleTimeUpdate = () => {
        if (el.duration && words.length > 0) {
          const progress = el.currentTime / el.duration;
          const newIdx = Math.min(
            Math.floor(progress * words.length),
            words.length - 1
          );
          setHighlightedWordIdx(newIdx);
        }
      };

      el.addEventListener('timeupdate', handleTimeUpdate);

      await el.play();
    } catch (err) {
      console.error('Failed to play audio with highlight:', err);
      playBeep();
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
        handleFinish();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, countdownStartTime]);

  const handleFinish = async () => {
    if (!startTimeRef.current || !student) return;

    setIsRecording(false);

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      const stopPromise = new Promise<void>((resolve) => {
        mediaRecorderRef.current!.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
          resolve();
        };
      });

      await stopPromise;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
    const wpm = Math.round((totalWords / elapsedSec) * 60);

    const resultData = { totalWords, elapsedSec, wpm, targetWPM };

    try {
      // Save reading log to Supabase
      await insertReadingLog(student.id, storyId, 3, wpm, totalWords, totalWords);

      // Mark step as completed with result data
      if (onStepCompleted) {
        await onStepCompleted(resultData);
      }
    } catch (err) {
      console.error('Failed to save reading data:', err);
    }

    setPhase('done');
  };

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
          {(appMode === 'dev' || introAudioEnded || !isAudioPlaying) && (
            <button 
              onClick={startCountdown} 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
            >
              Başla
            </button>
          )}
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
              {isAudioPlaying && (
                <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm text-blue-800 font-semibold">🔊 DOST okuyor... Kelime harita takip et!</p>
                </div>
              )}
            </div>
            <div className="text-lg text-gray-800 leading-relaxed">
              {paragraphs.map((p, i) => {
                let wordCount = 0;
                return (
                  <p key={i} className="mt-3">
                    {p.map((seg, j) => {
                      const segWords = seg.text.split(/\s+/).filter(w => w.length > 0);
                      const startIdx = wordCount;
                      wordCount += segWords.length;

                      return (
                        <span key={j} className={seg.bold ? 'font-bold' : undefined}>
                          {segWords.map((word, wIdx) => {
                            const globalIdx = startIdx + wIdx;
                            const isHighlighted = globalIdx === highlightedWordIdx;
                            return (
                              <span
                                key={wIdx}
                                className={`transition-all duration-150 ${
                                  isHighlighted
                                    ? 'bg-yellow-300 px-1 rounded font-bold scale-110 shadow-md'
                                    : 'hover:bg-yellow-100'
                                }`}
                              >
                                {word}{' '}
                              </span>
                            );
                          })}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </div>
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600">
                {highlightedWordIdx !== null && (
                  <p className="font-semibold">📍 Kelime: {highlightedWordIdx + 1}/{words.length}</p>
                )}
              </div>
              <button onClick={finishReading} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded">Bitir</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800">Okuma tamamlandı. Bir sonraki adımda hızın ve hedefin değerlendirilecek.</p>
        </div>
      )}
    </div>
  );
}
