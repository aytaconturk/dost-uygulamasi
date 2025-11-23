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
    };
  }, []);

  useEffect(() => {
    if (!introAudioPlayed && phase === 'intro' && audioRef.current) {
      const playIntroAudio = async () => {
        try {
          audioRef.current!.src = '/src/assets/audios/level3/seviye-3-adim-2.mp3';
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

  const playBeep = () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.src = '/src/assets/audios/level3/simdi-sira-sende.mp3';
      // Apply playback rate
      el.playbackRate = getPlaybackRate();
      // @ts-ignore
      el.playsInline = true; el.muted = false; el.play().catch(() => {});
    } catch {}
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
          setPhase('reading');
          startTimeRef.current = Date.now();
          startAudioWithHighlight();
        }
        return c - 1;
      });
    }, 1000);
  };

  const startAudioWithHighlight = async () => {
    const el = audioRef.current;
    if (!el) return;

    try {
      el.src = '/src/assets/audios/level3/seviye-3-adim-2.mp3';
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

  const finishReading = async () => {
    if (!startTimeRef.current || !student) return;

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
            {isAudioPlaying && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold">🔊 DOST okuyor... Kelime harita takip et!</p>
              </div>
            )}
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
