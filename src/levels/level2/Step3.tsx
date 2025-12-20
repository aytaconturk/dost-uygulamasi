import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedGoal, setIsLoading } from '../../store/level2Slice';
import { insertReadingGoal } from '../../lib/supabase';
import { submitReadingGoalSelection } from '../../lib/level2-api';
import type { RootState, AppDispatch } from '../../store/store';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { useStepContext } from '../../contexts/StepContext';

const STORY_ID = 2;

export default function Level2Step3() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { onStepCompleted } = useStepContext();

  const analysisResult = useSelector((state: RootState) => state.level2.analysisResult);
  const student = useSelector((state: RootState) => state.user.student);
  const teacher = useSelector((state: RootState) => state.user.teacher);
  const isLoading = useSelector((state: RootState) => state.level2.isLoading);

  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  useEffect(() => {
    const stopAll = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    };
  }, []);

  if (!analysisResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Henüz okuma analizi sonucu yok.</p>
          <button
            onClick={() => navigate('/level/2/step/1')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const baseWpm = analysisResult.readingSpeed?.wordsPerMinute || 0;
  
  const goals = [
    { percentage: 5, wpm: Math.ceil(baseWpm * 1.05), label: '%5 Artış' },
    { percentage: 7, wpm: Math.ceil(baseWpm * 1.07), label: '%7 Artış' },
    { percentage: 10, wpm: Math.ceil(baseWpm * 1.10), label: '%10 Artış' },
  ];

  const playAudioFromBase64 = async (base64: string): Promise<void> => {
    if (!audioRef.current || !base64) throw new Error('no audio');

    const tryMime = async (mime: string) => {
      const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
      audioRef.current!.src = src;
      // Apply playback rate
      audioRef.current!.playbackRate = getPlaybackRate();

      await audioRef.current?.play();
      await new Promise<void>((resolve) => {
        audioRef.current?.addEventListener('ended', () => resolve(), { once: true });
      });
    };

    try {
      await tryMime('audio/mpeg');
    } catch {
      try {
        await tryMime('audio/webm;codecs=opus');
      } catch {
        await tryMime('audio/wav');
      }
    }
  };

  const handleGoalSelect = async (percentage: number, wpm: number) => {
    if (!student) return;

    setSelectedPercentage(percentage);
    dispatch(setIsLoading(true));
    setIsPlayingAudio(true);

    try {
      // Call API to get audio feedback
      const apiResponse = await submitReadingGoalSelection({
        studentId: student.id,
        storyId: STORY_ID,
        level: 2,
        step: 3,
        targetWpm: wpm,
        percentage: percentage,
        baseWpm: baseWpm,
      });

      // Save to Supabase
      const result = await insertReadingGoal(
        student.id,
        STORY_ID,
        2,
        wpm,
        percentage,
        baseWpm,
        teacher?.id
      );

      if (result.error) {
        console.error('Supabase error:', result.error);
      }

      // Save to Redux
      dispatch(setSelectedGoal({ goal: wpm, percentage }));

      // Show feedback
      const feedback = `Harika! Şimdi seninle çalıştıktan sonra 1 dakikada ${wpm} sözcük okumaya çalışacaksın. Sana güveniyorum. Yapabilirsin! 💪\n\nOkuma hedefi olarak bir sonraki okumanda bir dakikada ${wpm} sözcük okumayı seçtin. Bir sonraki okumandan sonra hedefime ulaşıp ula��amadığına yönelik geri bildirim vereceğim.`;
      setFeedbackText(feedback);
      setShowFeedback(true);

      // Play audio if available
      if (apiResponse.audioBase64) {
        try {
          await playAudioFromBase64(apiResponse.audioBase64);
        } catch (err) {
          console.error('Error playing audio:', err);
        }
      }

      // Mark step as completed
      if (onStepCompleted) {
        await onStepCompleted({
          selectedWpm: wpm,
          percentage,
          baseWpm,
          feedback: feedback
        });
      }
    } catch (err) {
      console.error('Error in handleGoalSelect:', err);
      setShowFeedback(true);
    } finally {
      dispatch(setIsLoading(false));
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold text-purple-800 text-center">3. Adım: Okuma hedefi belirleme</h2>

        <div className="bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-300 rounded-xl p-6 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-purple-900 mb-2">📊 Şu anki Okuma Hızın</h3>
          <p className="text-4xl font-bold text-purple-600 mb-4">{baseWpm} sözcük/dakika</p>
          <p className="text-gray-700">Şimdi bu okuma hedeflerinden birini seç ve gelecek okumalarında bu hedefi yakalamaya çalış!</p>
        </div>

        {!showFeedback ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
            {goals.map((goal) => (
              <button
                key={goal.percentage}
                onClick={() => handleGoalSelect(goal.percentage, goal.wpm)}
                disabled={isLoading || selectedPercentage !== null}
                className={`p-6 rounded-xl border-4 transition-all font-bold text-lg cursor-pointer transform hover:scale-105 ${
                  selectedPercentage === goal.percentage
                    ? 'bg-amber-100 border-amber-600 text-amber-900 shadow-lg'
                    : 'bg-white border-amber-400 hover:bg-amber-50 text-gray-800 hover:border-amber-600 hover:shadow-md'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-3xl mb-2">{goal.label}</div>
                <div className="text-2xl text-amber-600 font-bold">{goal.wpm}</div>
                <div className="text-sm text-gray-600 mt-2">sözcük/dakika</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 text-center max-w-2xl mx-auto">
            <h4 className="font-bold text-green-900 mb-4 text-xl">✅ DOST'un Mesajı</h4>
            <p className="text-gray-800 text-lg mb-6 whitespace-pre-line leading-relaxed">{feedbackText}</p>
            <button
              onClick={() => navigate('/level/2/step/4')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
            >
              Devam Et →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
