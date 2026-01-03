import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getComprehensionQuestions } from '../../data/stories';
import { getComprehensionQuestionsByStory, type ComprehensionQuestion, logStudentAction, awardPoints } from '../../lib/supabase';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { playSoundEffect } from '../../lib/soundEffects';
import type { RootState } from '../../store/store';
import PointsAnimation from '../../components/PointsAnimation';
import { useBadges } from '../../hooks/useBadges';
import BadgeAnimation from '../../components/BadgeAnimation';
import { TestTube } from 'lucide-react';

interface QuestionData {
  question: string;
  options: string[];
  correctIndex: number;
  questionNumber: number; // UI için 1-5 arası numara
  originalQuestionOrder: number; // Ses dosyası için orijinal question_order
  questionAudioUrl?: string | null;
  correctAnswerAudioUrl?: string | null;
  wrongAnswerAudioUrl?: string | null;
}

export default function L5Step1() {
  const student = useSelector((state: RootState) => state.user.student);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [playingQuestionAudio, setPlayingQuestionAudio] = useState(false);
  const [playingOptionAudio, setPlayingOptionAudio] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [testAudioActive, setTestAudioActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Duplicate submit prevention
  const audioQueueRef = useRef<AbortController | null>(null); // Audio queue control
  const { onStepCompleted, storyId, sessionId } = useStepContext();
  const { checkForNewBadges, newBadges, clearNewBadges } = useBadges();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

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

  // Load questions from Supabase, fallback to static data, then select random 5
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const { data: supabaseQuestions, error } = await getComprehensionQuestionsByStory(storyId || 3);
        
        let allQuestions: QuestionData[] = [];
        
        if (!error && supabaseQuestions && supabaseQuestions.length > 0) {
          // Convert Supabase questions to QuestionData format
          allQuestions = supabaseQuestions.map((q: ComprehensionQuestion, idx: number) => ({
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correctIndex: q.correct_option === 'A' ? 0 : q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : 3,
            questionNumber: q.question_order || idx + 1,
            originalQuestionOrder: q.question_order || idx + 1, // Ses dosyası için orijinal order
          }));
        } else {
          // Fallback to static questions
          const staticQuestions = getComprehensionQuestions(storyId || 3);
          allQuestions = staticQuestions.map((q, idx) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            questionNumber: idx + 1,
            originalQuestionOrder: idx + 1, // Ses dosyası için orijinal order
          }));
        }

        // Random 5 soru seç (eğer 5'ten fazla varsa)
        if (allQuestions.length > 5) {
          const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 5);
          // Seçilen soruları questionNumber'a göre sırala
          selected.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
          // QuestionNumber'ları 1-5 olarak yeniden numaralandır (UI için)
          // Ama originalQuestionOrder'ı koru (ses dosyası için)
          const renumbered = selected.map((q, idx) => ({
            ...q,
            questionNumber: idx + 1, // UI için 1-5
            originalQuestionOrder: q.originalQuestionOrder, // Ses dosyası için orijinal
          }));
          console.log('Setting questions (random 5):', renumbered);
          setQuestions(renumbered);
        } else {
          // 5 veya daha az soru varsa hepsini kullan
          const questionsWithNumbers = allQuestions.map((q, idx) => ({
            ...q,
            questionNumber: q.questionNumber || idx + 1,
            originalQuestionOrder: q.originalQuestionOrder || q.questionNumber || idx + 1,
          }));
          console.log('Setting questions (all):', questionsWithNumbers);
          setQuestions(questionsWithNumbers);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        // Fallback to static questions
        const staticQuestions = getComprehensionQuestions(storyId || 3);
        const allQuestions = staticQuestions.map((q, idx) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          questionNumber: idx + 1,
          originalQuestionOrder: idx + 1, // Ses dosyası için orijinal order
        }));
        
        // Random 5 soru seç
        if (allQuestions.length > 5) {
          const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 5);
          selected.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
          const renumbered = selected.map((q, idx) => ({
            ...q,
            questionNumber: idx + 1, // UI için 1-5
            originalQuestionOrder: q.originalQuestionOrder, // Ses dosyası için orijinal
          }));
          console.log('Setting questions (error fallback, random 5):', renumbered);
          setQuestions(renumbered);
        } else {
          // Eğer questionNumber yoksa ekle
          const questionsWithNumbers = allQuestions.map((q, idx) => ({
            ...q,
            questionNumber: q.questionNumber || idx + 1,
            originalQuestionOrder: q.originalQuestionOrder || q.questionNumber || idx + 1,
          }));
          console.log('Setting questions (error fallback, all):', questionsWithNumbers);
          setQuestions(questionsWithNumbers);
        }
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [storyId]);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const stopAll = () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);

    return () => {
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

      // Check for perfect quiz badge
      if (student?.id && correctCount === questions.length) {
        checkForNewBadges(
          storyId || 3,
          5,
          sessionId,
          { 
            quizScore: 100,
            completedLevels: [1, 2, 3, 4, 5]
          }
        ).then(badges => {
          console.log(`🏆 Earned ${badges.length} badges for perfect quiz`);
        });
      }
    }
  }, [answers.length, questions.length, onStepCompleted, answers, questions, student?.id, storyId, sessionId, checkForNewBadges]);

  // Ses dosyası oynat (public/audios/sorular dizininden)
  const stopCurrentAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.src = '';
    }
    // Cancel any pending audio queue
    if (audioQueueRef.current) {
      audioQueueRef.current.abort();
      audioQueueRef.current = null;
    }
  }, []);

  const playAudioFile = useCallback(async (audioPath: string, signal?: AbortSignal): Promise<void> => {
    const el = audioRef.current;
    if (!el) return;

    // Check if aborted before starting
    if (signal?.aborted) {
      console.log('Audio playback aborted before start:', audioPath);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Stop any currently playing audio first
        el.pause();
        el.currentTime = 0;
        
        el.src = audioPath;
        el.playbackRate = getPlaybackRate();
        (el as any).playsInline = true;
        el.muted = false;
        
        const cleanup = () => {
          el.removeEventListener('ended', handleEnded);
          el.removeEventListener('error', handleError);
          signal?.removeEventListener('abort', handleAbort);
        };
        
        const handleError = () => {
          cleanup();
          console.warn(`Audio file not found: ${audioPath}`);
          resolve(); // Hata olsa bile devam et
        };
        
        const handleEnded = () => {
          cleanup();
          resolve();
        };
        
        const handleAbort = () => {
          el.pause();
          el.currentTime = 0;
          cleanup();
          console.log('Audio playback aborted:', audioPath);
          resolve(); // Abort durumunda da resolve et
        };
        
        el.addEventListener('ended', handleEnded, { once: true });
        el.addEventListener('error', handleError, { once: true });
        signal?.addEventListener('abort', handleAbort, { once: true });
        
        el.play().catch(err => {
          if (err.name === 'AbortError') {
            console.log('Audio play aborted:', audioPath);
            cleanup();
            resolve();
          } else {
            console.error('Error playing audio:', err);
            handleError();
          }
        });
      } catch (err) {
        console.error('Error setting up audio:', err);
        resolve(); // Hata olsa bile devam et
      }
    });
  }, []);

  // Soru seslendirmesi oynat - orijinal question_order kullan
  const playQuestionAudio = useCallback(async (question: QuestionData | undefined, signal?: AbortSignal) => {
    if (!question || !question.originalQuestionOrder) {
      console.warn('question or originalQuestionOrder is undefined');
      return;
    }
    if (signal?.aborted) return;
    
    setPlayingQuestionAudio(true);
    try {
      const audioPath = `/audios/sorular/question-${storyId || 3}-q${question.originalQuestionOrder}.mp3`;
      console.log('Playing question audio:', audioPath, 'for question:', question.question);
      await playAudioFile(audioPath, signal);
    } catch (err) {
      console.error('Error playing question audio:', err);
    } finally {
      setPlayingQuestionAudio(false);
    }
  }, [storyId, playAudioFile]);

  // Şık seslendirmesi oynat - orijinal question_order kullan
  const playOptionAudio = useCallback(async (question: QuestionData | undefined, optionIndex: number, signal?: AbortSignal) => {
    if (!question || !question.originalQuestionOrder) {
      console.warn('question or originalQuestionOrder is undefined');
      return;
    }
    if (signal?.aborted) return;
    
    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
    setPlayingOptionAudio(optionIndex);
    try {
      const audioPath = `/audios/sorular/option-${storyId || 3}-q${question.originalQuestionOrder}-${optionLetter}.mp3`;
      console.log('Playing option audio:', audioPath);
      await playAudioFile(audioPath, signal);
    } catch (err) {
      console.error('Error playing option audio:', err);
    } finally {
      setPlayingOptionAudio(null);
    }
  }, [storyId, playAudioFile]);

  const startFlow = async () => {
    if (loadingQuestions) {
      console.warn('Cannot start flow: questions are still loading');
      return;
    }
    
    if (questions.length === 0) {
      console.warn('Cannot start flow: no questions available');
      return;
    }
    
    setStarted(true);
    
    // Cancel any previous audio queue
    stopCurrentAudio();
    
    // Create new AbortController for this flow
    const controller = new AbortController();
    audioQueueRef.current = controller;
    
    // Play first question audio and options
    const firstQuestion = questions[0];
    if (!firstQuestion) {
      console.error('First question is undefined');
      return;
    }
    
    console.log('startFlow - firstQuestion:', firstQuestion);
    
    if (!firstQuestion || !firstQuestion.originalQuestionOrder) {
      console.error('Invalid question in startFlow:', firstQuestion);
      return;
    }
    
    await playQuestionAudio(firstQuestion, controller.signal);
    // Şıkları da seslendir
    for (let i = 0; i < firstQuestion.options.length; i++) {
      if (controller.signal.aborted) break;
      await playOptionAudio(firstQuestion, i, controller.signal);
    }
  };

  const onSubmitAnswer = async () => {
    if (selectedAnswer === null) return;
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.warn('Submit already in progress, ignoring duplicate');
      return;
    }
    setIsSubmitting(true);

    const question = questions[currentQuestion];
    if (!question || typeof question.questionNumber !== 'number') {
      console.error('Invalid question in onSubmitAnswer:', question);
      setIsSubmitting(false);
      return;
    }
    
    // Stop any currently playing audio before processing answer
    stopCurrentAudio();
    
    const isCorrect = selectedAnswer === question.correctIndex;
    const selectedOptionText = question.options[selectedAnswer];
    const correctOptionText = question.options[question.correctIndex];
    const optionLetter = String.fromCharCode(65 + selectedAnswer); // A, B, C, D

    // Log the answer
    if (student && sessionId && storyId) {
      try {
        await logStudentAction(
          sessionId,
          student.id,
          isCorrect ? 'comprehension_question_correct' : 'comprehension_question_wrong',
          storyId,
          5, // level
          1, // step
          {
            questionNumber: question.questionNumber,
            originalQuestionOrder: question.originalQuestionOrder,
            questionText: question.question,
            selectedAnswer: optionLetter,
            selectedAnswerText: selectedOptionText,
            correctAnswer: String.fromCharCode(65 + question.correctIndex),
            correctAnswerText: correctOptionText,
            isCorrect
          }
        );
        console.log('✅ Answer logged:', { isCorrect, questionNumber: question.questionNumber, selectedAnswer: optionLetter });
      } catch (err) {
        console.error('❌ Error logging answer:', err);
      }
    }

    // Award points for correct answers
    if (isCorrect && student && storyId) {
      try {
        const { error: pointsError } = await awardPoints(
          student.id,
          storyId,
          10,
          `Seviye 5 - Soru ${question.questionNumber} doğru cevap`
        );
        if (pointsError) {
          console.error('❌ Error awarding points:', pointsError);
        } else {
          console.log('✅ 10 puan eklendi');
          setTotalScore(prev => prev + 10);
          // Reset animation state first, then trigger it
          setShowPointsAnimation(false);
          // Use setTimeout to ensure state reset before triggering animation
          setTimeout(() => {
            setEarnedPoints(10);
            setShowPointsAnimation(true);
            // Auto-hide animation after 2 seconds
            setTimeout(() => {
              setShowPointsAnimation(false);
            }, 2000);
          }, 50);
          // Trigger progress update event to refresh header
          window.dispatchEvent(new Event('progressUpdated'));
        }
      } catch (err) {
        console.error('❌ Error awarding points:', err);
      }
    }

    setAnswers([...answers, selectedAnswer]);

    // Create new AbortController for feedback audio
    const controller = new AbortController();
    audioQueueRef.current = controller;

    if (isCorrect) {
      setFeedback('✓ Çok iyi! Cevap doğru!');
      // Play correct answer audio - orijinal question_order kullan
      const correctPath = `/audios/sorular/correct-${storyId || 3}-q${question.originalQuestionOrder || question.questionNumber}.mp3`;
      await playAudioFile(correctPath, controller.signal).catch(() => {
        // Fallback to success sound if audio file not found
        playSoundEffect('success');
      });
    } else {
      setFeedback(`✗ Maalesef yanlış. Doğru cevap: "${correctOptionText}"`);
      // Play wrong answer audio - orijinal question_order kullan
      const wrongPath = `/audios/sorular/wrong-${storyId || 3}-q${question.originalQuestionOrder || question.questionNumber}.mp3`;
      await playAudioFile(wrongPath, controller.signal).catch(() => {
        // Fallback to error sound if audio file not found
        playSoundEffect('error');
      });
    }

    setSelectedAnswer(null);
    setIsSubmitting(false); // Reset submitting state after feedback audio

    // Wait 2 seconds then move to next question
    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        const nextQuestionIdx = currentQuestion + 1;
        setCurrentQuestion(nextQuestionIdx);
        setFeedback('');
        
        // Create new AbortController for next question audio
        const nextController = new AbortController();
        audioQueueRef.current = nextController;
        
        // Play next question audio and options
        const nextQuestion = questions[nextQuestionIdx];
        if (nextQuestion && nextQuestion.originalQuestionOrder) {
          await playQuestionAudio(nextQuestion, nextController.signal);
          // Şıkları da seslendir
          for (let i = 0; i < nextQuestion.options.length; i++) {
            if (nextController.signal.aborted) break;
            await playOptionAudio(nextQuestion, i, nextController.signal);
          }
        } else {
          console.error('Invalid nextQuestion:', nextQuestion);
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
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        <div className="bg-white rounded-xl shadow p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold text-purple-800">Sorular Tamamlandı!</h3>
          <p className="text-lg text-gray-700">
            {correctCount} / {questions.length} soruya doğru cevap verdin.
          </p>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-800 mb-1">Toplam Puan</p>
            <p className="text-4xl font-bold text-white">{totalScore} Puan</p>
          </div>
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
      <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
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
            <div className="flex flex-col items-center gap-3">
              {testAudioActive && (
                <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  <span>🧪 Test modu: Hazır ses kullanılacak</span>
                </div>
              )}
              
              <button 
                onClick={startFlow} 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Başla
              </button>
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
              <button
                onClick={async () => {
                  // Cancel any previous audio
                  stopCurrentAudio();
                  
                  const controller = new AbortController();
                  audioQueueRef.current = controller;
                  
                  const currentQ = questions[currentQuestion];
                  if (currentQ && currentQ.originalQuestionOrder) {
                    await playQuestionAudio(currentQ, controller.signal);
                    // Şıkları da seslendir
                    for (let i = 0; i < currentQ.options.length; i++) {
                      if (controller.signal.aborted) break;
                      await playOptionAudio(currentQ, i, controller.signal);
                    }
                  } else {
                    console.error('Invalid question in play button:', currentQ);
                  }
                }}
                disabled={playingQuestionAudio || playingOptionAudio !== null}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm"
              >
                {playingQuestionAudio || playingOptionAudio !== null ? '⏳ DOST konuşuyor' : '🔊 Soruyu ve Şıkları Dinle'}
              </button>
            </div>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, idx) => (
                <div
                  key={idx}
                  onClick={async () => {
                    if (feedback !== '' || isSubmitting) return;
                    setSelectedAnswer(idx);
                    // Stop any currently playing audio before playing option
                    stopCurrentAudio();
                    // Şık seslendirmesi
                    const currentQ = questions[currentQuestion];
                    if (currentQ && currentQ.originalQuestionOrder) {
                      await playOptionAudio(currentQ, idx);
                    } else {
                      console.error('Invalid question in option button:', currentQ);
                    }
                  }}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                    selectedAnswer === idx
                      ? 'border-purple-500 bg-purple-50'
                      : feedback !== '' && idx === questions[currentQuestion].correctIndex
                      ? 'border-green-500 bg-green-50'
                      : feedback !== '' && idx === selectedAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-purple-300 bg-white'
                  } ${feedback !== '' || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
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
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        stopCurrentAudio();
                        const currentQ = questions[currentQuestion];
                        if (currentQ && currentQ.originalQuestionOrder) {
                          await playOptionAudio(currentQ, idx);
                        } else {
                          console.error('Invalid question in option play button:', currentQ);
                        }
                      }}
                      disabled={playingOptionAudio === idx}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-sm"
                    >
                      {playingOptionAudio === idx ? '⏳' : '🔊'}
                    </button>
                  </div>
                </div>
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
              disabled={selectedAnswer === null || feedback !== '' || isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold mt-6"
            >
              {isSubmitting ? '⏳ Gönderiliyor...' : 'Cevap Gönder'}
            </button>
          </div>
        </div>
      )}

      {/* Badge Animation */}
      {newBadges.length > 0 && (
        <BadgeAnimation 
          badge={newBadges[0]} 
          show={true}
          onClose={clearNewBadges}
        />
      )}
    </div>
  );
}
