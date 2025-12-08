import { useEffect, useRef, useState } from 'react';
import { getComprehensionQuestions } from '../../data/stories';
import { getComprehensionQuestionsByStory, type ComprehensionQuestion } from '../../lib/supabase';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { playSoundEffect } from '../../lib/soundEffects';

interface QuestionData {
  question: string;
  options: string[];
  correctIndex: number;
  questionAudioUrl?: string | null;
  correctAnswerAudioUrl?: string | null;
  wrongAnswerAudioUrl?: string | null;
}

export default function L5Step1() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [introAudioPlaying, setIntroAudioPlaying] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [playingQuestionAudio, setPlayingQuestionAudio] = useState(false);
  const { onStepCompleted, storyId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // Load questions from Supabase, fallback to static data
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const { data: supabaseQuestions, error } = await getComprehensionQuestionsByStory(storyId || 3);
        
        if (!error && supabaseQuestions && supabaseQuestions.length > 0) {
          // Convert Supabase questions to QuestionData format
          const convertedQuestions: QuestionData[] = supabaseQuestions.map((q: ComprehensionQuestion) => ({
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correctIndex: q.correct_option === 'A' ? 0 : q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : 3,
            questionAudioUrl: q.question_audio_url,
            correctAnswerAudioUrl: q.correct_answer_audio_url,
            wrongAnswerAudioUrl: q.wrong_answer_audio_url,
          }));
          setQuestions(convertedQuestions);
        } else {
          // Fallback to static questions
          const staticQuestions = getComprehensionQuestions(storyId || 3);
          setQuestions(staticQuestions.map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          })));
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        // Fallback to static questions
        const staticQuestions = getComprehensionQuestions(storyId || 3);
        setQuestions(staticQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
        })));
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [storyId]);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

  // Play intro audio on mount
  useEffect(() => {
    const playIntroAudio = () => {
      const el = audioRef.current;
      if (!el) {
        setTimeout(playIntroAudio, 100);
        return;
      }

      console.log('🎵 Setting up intro audio:', '/audios/level5/seviye-5-adim-1.mp3');
      el.src = '/audios/level5/seviye-5-adim-1.mp3';
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

  // Mark step as completed when all questions are answered
  useEffect(() => {
    if (answers.length === questions.length && onStepCompleted) {
      const correctCount = answers.filter(
        (ans, idx) => ans === questions[idx].correctIndex
      ).length;
      
      onStepCompleted({
        totalQuestions: questions.length,
        correctCount,
        answers
      });
    }
  }, [answers.length, questions.length, onStepCompleted, answers, questions]);

  const playAudio = async (audioPath: string) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.src = audioPath;
        el.playbackRate = getPlaybackRate();
        (el as any).playsInline = true; 
        el.muted = false;
        await el.play();
      } catch {}
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
    
    // Play first question audio if available
    if (questions.length > 0 && questions[0].questionAudioUrl) {
      await playQuestionAudio(questions[0].questionAudioUrl);
    }
  };

  const playQuestionAudio = async (audioUrl: string) => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;

    setPlayingQuestionAudio(true);
    try {
      el.src = audioUrl;
      el.playbackRate = getPlaybackRate();
      (el as any).playsInline = true;
      el.muted = false;
      await el.play();
      
      // Wait for audio to finish
      await new Promise<void>((resolve) => {
        const handleEnded = () => {
          el.removeEventListener('ended', handleEnded);
          resolve();
        };
        el.addEventListener('ended', handleEnded, { once: true });
      });
    } catch (err) {
      console.error('Error playing question audio:', err);
    } finally {
      setPlayingQuestionAudio(false);
    }
  };

  const onSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctIndex;

    setAnswers([...answers, selectedAnswer]);

    if (isCorrect) {
      setFeedback('✓ Çok iyi! Cevap doğru!');
      // Play correct answer audio if available, otherwise play success sound
      if (question.correctAnswerAudioUrl) {
        await playQuestionAudio(question.correctAnswerAudioUrl);
      } else {
        await playSoundEffect('success');
      }
    } else {
      const correctOption = question.options[question.correctIndex];
      setFeedback(`✗ Maalesef yanlış. Doğru cevap: "${correctOption}"`);
      // Play wrong answer audio if available, otherwise play error sound
      if (question.wrongAnswerAudioUrl) {
        await playQuestionAudio(question.wrongAnswerAudioUrl);
      } else {
        await playSoundEffect('error');
      }
    }

    setSelectedAnswer(null);

    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        const nextQuestionIdx = currentQuestion + 1;
        setCurrentQuestion(nextQuestionIdx);
        setFeedback('');
        
        // Play next question audio if available
        if (questions[nextQuestionIdx]?.questionAudioUrl) {
          await playQuestionAudio(questions[nextQuestionIdx].questionAudioUrl);
        }
      }
    }, 2000);
  };

  if (loadingQuestions) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Sorular yükleniyor...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Sorular bulunamadı</p>
      </div>
    );
  }

  if (answers.length === questions.length) {
    const correctCount = answers.filter(
      (ans, idx) => ans === questions[idx].correctIndex
    ).length;

    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold text-purple-800">Sorular Tamamlandı!</h3>
          <p className="text-lg text-gray-700">
            {correctCount} / {questions.length} soruya doğru cevap verdin.
          </p>
          {correctCount === questions.length && (
            <p className="text-xl text-green-600 font-bold">Mükemmel! Tüm soruları doğru yanıtladın! 🎉</p>
          )}
          {correctCount >= questions.length - 1 && correctCount < questions.length && (
            <p className="text-lg text-blue-600">Çok iyi başarı! Biraz daha pratik yapabilirsin.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">1. Adım: Okuduğunu Anlama Soruları</h2>
        {!started && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mb-4">
              <p className="text-gray-700 text-left leading-relaxed">
                Beşinci seviyeye geçiyoruz. Şimdi sana metinle ilgili {questions.length} tane okuduğunu anlama sorusu soracağım ve cevaplarının doğruluğunu kontrol edeceğim. Sen cevap vermeden diğer soruya geçmeyeceğim. Başlıyorum.
              </p>
            </div>
            <div className="flex justify-center">
              {introAudioPlaying ? (
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-800">
                Soru {currentQuestion + 1} / {questions.length}
              </h3>
              <div className="text-sm text-gray-600">
                <span className="font-bold text-green-600">{answers.length}</span> / {questions.length} tamamlandı
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-gray-800">
                {questions[currentQuestion].question}
              </h4>
              {questions[currentQuestion].questionAudioUrl && (
                <button
                  onClick={() => playQuestionAudio(questions[currentQuestion].questionAudioUrl!)}
                  disabled={playingQuestionAudio}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm"
                >
                  {playingQuestionAudio ? '⏳ Çalınıyor...' : '🔊 Soruyu Dinle'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  disabled={feedback !== ''}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                    selectedAnswer === idx
                      ? 'border-purple-500 bg-purple-50'
                      : feedback !== '' && idx === questions[currentQuestion].correctIndex
                      ? 'border-green-500 bg-green-50'
                      : feedback !== '' && idx === selectedAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-purple-300 bg-white'
                  } ${feedback !== '' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold ${
                      selectedAnswer === idx
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {feedback && (
              <div className={`p-4 rounded-lg font-semibold text-center ${
                feedback.startsWith('✓')
                  ? 'bg-green-100 border-2 border-green-500 text-green-700'
                  : 'bg-red-100 border-2 border-red-500 text-red-700'
              }`}>
                {feedback}
              </div>
            )}

            <button
              onClick={onSubmitAnswer}
              disabled={selectedAnswer === null || feedback !== ''}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold mt-6"
            >
              Cevap Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
