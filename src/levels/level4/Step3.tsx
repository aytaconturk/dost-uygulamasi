import { useEffect, useRef, useState } from 'react';
import { getComprehensionQuestions } from '../../data/stories';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';

export default function L4Step3() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const { onStepCompleted, storyId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const questions = getComprehensionQuestions(storyId || 1);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
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
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        await el.play();
      } catch {}
    }
  };

  const startFlow = async () => {
    setStarted(true);
    await playAudio('/src/assets/audios/level4/level4-step3-intro.mp3');
  };

  const onSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctIndex;

    setAnswers([...answers, selectedAnswer]);

    if (isCorrect) {
      setFeedback('✓ Çok iyi! Cevap doğru!');
    } else {
      const correctOption = question.options[question.correctIndex];
      setFeedback(`✗ Maalesef yanlış. Doğru cevap: "${correctOption}"`);
    }

    setSelectedAnswer(null);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setFeedback('');
      }
    }, 2000);
  };

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
        <h2 className="text-2xl font-bold text-purple-800">3. Adım: Okuduğunu Anlama Soruları</h2>
        {!started && (
          <button onClick={startFlow} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
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
            <h4 className="text-xl font-semibold text-gray-800">
              {questions[currentQuestion].question}
            </h4>

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
