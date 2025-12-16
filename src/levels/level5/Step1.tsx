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
  questionNumber: number;
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
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [playingQuestionAudio, setPlayingQuestionAudio] = useState(false);
  const [playingOptionAudio, setPlayingOptionAudio] = useState<number | null>(null);
  const { onStepCompleted, storyId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // Load questions from Supabase, fallback to static data
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
          }));
        } else {
          // Fallback to static questions
          const staticQuestions = getComprehensionQuestions(storyId || 3);
          allQuestions = staticQuestions.map((q, idx) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            questionNumber: idx + 1,
          }));
        }

        // Random 5 soru seç (eğer 5'ten fazla varsa)
        if (allQuestions.length > 5) {
          const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 5);
          // Seçilen soruları questionNumber'a göre sırala
          selected.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
          // QuestionNumber'ları 1-5 olarak yeniden numaralandır
          const renumbered = selected.map((q, idx) => ({
            ...q,
            questionNumber: idx + 1,
          }));
          console.log('Setting questions (random 5):', renumbered);
          setQuestions(renumbered);
        } else {
          // 5 veya daha az soru varsa hepsini kullan
          // Eğer questionNumber yoksa ekle
          const questionsWithNumbers = allQuestions.map((q, idx) => ({
            ...q,
            questionNumber: q.questionNumber || idx + 1,
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
        }));
        
        // Random 5 soru seç
        if (allQuestions.length > 5) {
          const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 5);
          selected.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
          const renumbered = selected.map((q, idx) => ({
            ...q,
            questionNumber: idx + 1,
          }));
          console.log('Setting questions (error fallback, random 5):', renumbered);
          setQuestions(renumbered);
        } else {
          // Eğer questionNumber yoksa ekle
          const questionsWithNumbers = allQuestions.map((q, idx) => ({
            ...q,
            questionNumber: q.questionNumber || idx + 1,
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
    }
  }, [answers.length, questions.length, onStepCompleted, answers, questions]);

  // Ses dosyası oynat (public/audios/sorular dizininden)
  const playAudioFile = async (audioPath: string): Promise<void> => {
    const el = audioRef.current;
    if (!el) return;

    return new Promise<void>((resolve, reject) => {
      try {
        el.src = audioPath;
        el.playbackRate = getPlaybackRate();
        (el as any).playsInline = true;
        el.muted = false;
        
        const handleEnded = () => {
          el.removeEventListener('ended', handleEnded);
          el.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = () => {
          el.removeEventListener('ended', handleEnded);
          el.removeEventListener('error', handleError);
          console.warn(`Audio file not found: ${audioPath}`);
          resolve(); // Hata olsa bile devam et
        };
        
        el.addEventListener('ended', handleEnded, { once: true });
        el.addEventListener('error', handleError, { once: true });
        
        el.play().catch(err => {
          console.error('Error playing audio:', err);
          handleError();
        });
      } catch (err) {
        console.error('Error setting up audio:', err);
        resolve(); // Hata olsa bile devam et
      }
    });
  };

  // Soru seslendirmesi oynat
  const playQuestionAudio = async (questionNumber: number | undefined) => {
    if (!questionNumber) {
      console.warn('questionNumber is undefined');
      return;
    }
    setPlayingQuestionAudio(true);
    try {
      const audioPath = `/audios/sorular/question-${storyId || 3}-q${questionNumber}.mp3`;
      console.log('Playing question audio:', audioPath);
      await playAudioFile(audioPath);
    } catch (err) {
      console.error('Error playing question audio:', err);
    } finally {
      setPlayingQuestionAudio(false);
    }
  };

  // Şık seslendirmesi oynat
  const playOptionAudio = async (questionNumber: number | undefined, optionIndex: number) => {
    if (!questionNumber) {
      console.warn('questionNumber is undefined');
      return;
    }
    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
    setPlayingOptionAudio(optionIndex);
    try {
      const audioPath = `/audios/sorular/option-${storyId || 3}-q${questionNumber}-${optionLetter}.mp3`;
      console.log('Playing option audio:', audioPath);
      await playAudioFile(audioPath);
    } catch (err) {
      console.error('Error playing option audio:', err);
    } finally {
      setPlayingOptionAudio(null);
    }
  };

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
    
    // Play first question audio and options
    const firstQuestion = questions[0];
    if (!firstQuestion) {
      console.error('First question is undefined');
      return;
    }
    
    const questionNum = firstQuestion.questionNumber;
    console.log('startFlow - questionNum:', questionNum, 'firstQuestion:', firstQuestion);
    
    if (typeof questionNum !== 'number' || questionNum <= 0) {
      console.error('Invalid questionNumber in startFlow:', questionNum, 'Question:', firstQuestion);
      return;
    }
    
    await playQuestionAudio(questionNum);
    // Şıkları da seslendir
    for (let i = 0; i < firstQuestion.options.length; i++) {
      await playOptionAudio(questionNum, i);
    }
  };

  const onSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    if (!question || typeof question.questionNumber !== 'number') {
      console.error('Invalid question in onSubmitAnswer:', question);
      return;
    }
    
    const isCorrect = selectedAnswer === question.correctIndex;

    setAnswers([...answers, selectedAnswer]);

    if (isCorrect) {
      setFeedback('✓ Çok iyi! Cevap doğru!');
      // Play correct answer audio
      const correctPath = `/audios/sorular/correct-${storyId || 3}-q${question.questionNumber}.mp3`;
      await playAudioFile(correctPath).catch(() => {
        // Fallback to success sound if audio file not found
        playSoundEffect('success');
      });
    } else {
      const correctOption = question.options[question.correctIndex];
      setFeedback(`✗ Maalesef yanlış. Doğru cevap: "${correctOption}"`);
      // Play wrong answer audio
      const wrongPath = `/audios/sorular/wrong-${storyId || 3}-q${question.questionNumber}.mp3`;
      await playAudioFile(wrongPath).catch(() => {
        // Fallback to error sound if audio file not found
        playSoundEffect('error');
      });
    }

    setSelectedAnswer(null);

    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        const nextQuestionIdx = currentQuestion + 1;
        setCurrentQuestion(nextQuestionIdx);
        setFeedback('');
        
        // Play next question audio and options
        const nextQuestion = questions[nextQuestionIdx];
        if (nextQuestion && typeof nextQuestion.questionNumber === 'number') {
          await playQuestionAudio(nextQuestion.questionNumber);
          // Şıkları da seslendir
          for (let i = 0; i < nextQuestion.options.length; i++) {
            await playOptionAudio(nextQuestion.questionNumber, i);
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
                  const currentQ = questions[currentQuestion];
                  if (currentQ && typeof currentQ.questionNumber === 'number') {
                    await playQuestionAudio(currentQ.questionNumber);
                    // Şıkları da seslendir
                    for (let i = 0; i < currentQ.options.length; i++) {
                      await playOptionAudio(currentQ.questionNumber, i);
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
                    if (feedback !== '') return;
                    setSelectedAnswer(idx);
                    // Şık seslendirmesi
                    const currentQ = questions[currentQuestion];
                    if (currentQ && typeof currentQ.questionNumber === 'number') {
                      await playOptionAudio(currentQ.questionNumber, idx);
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
                  } ${feedback !== '' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                        const currentQ = questions[currentQuestion];
                        if (currentQ && typeof currentQ.questionNumber === 'number') {
                          await playOptionAudio(currentQ.questionNumber, idx);
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
