import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase, awardPoints, updateStudentProgress } from '../lib/supabase';
import type { LevelStep } from '../lib/supabase-types';
import type { RootState } from '../store/store';
import { calculatePointsForLevel } from '../lib/points';
import PointsAnimation from './PointsAnimation';

interface DynamicLevelStepperProps {
  levelNumber: number;
  currentStep: number;
  onStepChange: (stepNumber: number) => void;
  onLevelComplete: () => void;
}

export default function DynamicLevelStepper({
  levelNumber,
  currentStep,
  onStepChange,
  onLevelComplete,
}: DynamicLevelStepperProps) {
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const [steps, setSteps] = useState<LevelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const storyId = searchParams.get('storyId');

  useEffect(() => {
    const fetchLevelSteps = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: levels } = await supabase
          .from('levels')
          .select('id')
          .eq('level_number', levelNumber)
          .single();

        if (!levels) {
          setError('Level not found');
          return;
        }

        const { data: stepsData, error: stepsError } = await supabase
          .from('level_steps')
          .select('*')
          .eq('level_id', levels.id)
          .order('step_number', { ascending: true });

        if (stepsError) {
          setError(stepsError.message);
          return;
        }

        setSteps(stepsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching steps');
      } finally {
        setLoading(false);
      }
    };

    fetchLevelSteps();
  }, [levelNumber]);

  if (loading) {
    return <div className="text-center py-8">Adımlar yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Hata: {error}</div>;
  }

  if (steps.length === 0) {
    return <div className="text-center py-8">Bu seviye için adım bulunamadı</div>;
  }

  return (
    <div className="w-full relative">
      <PointsAnimation show={showPointsAnimation} points={earnedPoints} />

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col items-center flex-1"
          >
            <button
              onClick={() => {
                if (step.step_number <= currentStep) {
                  onStepChange(step.step_number);
                }
              }}
              disabled={step.step_number > currentStep}
              className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                step.step_number < currentStep
                  ? 'bg-green-500 text-white'
                  : step.step_number === currentStep
                  ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {step.step_number < currentStep ? '✓' : step.step_number}
            </button>
            <p className="text-xs mt-2 text-center text-gray-600 max-w-20">
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg p-8 shadow-md">
        {steps[currentStep - 1] && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              Adım {currentStep}: {steps[currentStep - 1].title}
            </h2>
            {steps[currentStep - 1].description && (
              <p className="text-gray-700 mb-6">
                {steps[currentStep - 1].description}
              </p>
            )}
            {steps[currentStep - 1].instructions && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-700 font-semibold mb-2">Talimatlar:</p>
                <p className="text-blue-600">{steps[currentStep - 1].instructions}</p>
              </div>
            )}
            {steps[currentStep - 1].audio_file_url && (
              <div className="mb-6">
                <audio
                  controls
                  className="w-full"
                  src={steps[currentStep - 1].audio_file_url!}
                >
                  Ses dosyası desteklenmiyor
                </audio>
              </div>
            )}
            {steps[currentStep - 1].content && (
              <div className="prose prose-sm max-w-none mb-6">
                <p>{steps[currentStep - 1].content}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  if (currentStep > 1) {
                    onStepChange(currentStep - 1);
                  }
                }}
                disabled={currentStep === 1}
                className="px-6 py-2 bg-gray-400 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ← Önceki
              </button>

              {currentStep === steps.length ? (
                <button
                  onClick={async () => {
                    if (student && storyId) {
                      const points = calculatePointsForLevel(levelNumber, steps.length);
                      const { error: pointsError } = await awardPoints(
                        student.id,
                        Number(storyId),
                        points,
                        `Seviye ${levelNumber} tamamlandı`
                      );

                      if (!pointsError) {
                        setEarnedPoints(points);
                        setShowPointsAnimation(true);

                        setTimeout(() => {
                          onLevelComplete();
                        }, 1500);
                      }
                    } else {
                      onLevelComplete();
                    }
                  }}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-bold"
                >
                  Seviyeyi Tamamla ✓
                </button>
              ) : (
                <button
                  onClick={() => {
                    onStepChange(currentStep + 1);
                  }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Sonraki →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
