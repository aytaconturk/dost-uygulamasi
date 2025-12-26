// React 19: no default import required
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StepLayout from './components/StepLayout';
import Step1 from './level1/Step1';
import Step2 from './level1/Step2';
import Step3 from './level1/Step3';
import Step4 from './level1/Step4';
import Step5 from './level1/Step5';
import L2Step1 from './level2/Step1';
import L2Step2 from './level2/Step2';
import L2Step3 from './level2/Step3';
import L2Step4 from './level2/Step4';
import L3Step1 from './level3/Step1';
import L3Step2 from './level3/Step2';
import L3Step3 from './level3/Step3';
import L4Step1 from './level4/Step1';
import L4Step2 from './level4/Step2';
import L4Step4 from './level4/Step4';
import L5Step1 from './level5/Step1';
import L5Step2 from './level5/Step2';
import L5Step3 from './level5/Step3';
import { stopAllMedia } from '../lib/media';
import { getApiEnv, getAppMode } from '../lib/api';
import { 
  updateStudentProgressStep, 
  createSession, 
  getActiveSession,
  markStepStarted,
  isStepCompleted,
  markStepCompleted,
  logStudentAction,
  completeStory,
  endSession,
  getStoryById
} from '../lib/supabase';
import type { RootState } from '../store/store';
import { StepProvider } from '../contexts/StepContext';

const LEVEL_STEPS_COUNT: Record<number, number> = {
  1: 5,
  2: 3,
  3: 3,
  4: 3,
  5: 3,
};

const LEVEL1_TITLES = [
  '1. Adım: Metnin görselini inceleme ve tahminde bulunma',
  '2. Adım: Metnin başlığını inceleme ve tahminde bulunma',
  '3. Adım: Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma',
  '4. Adım: Okuma amacı belirleme',
];

const LEVEL2_TITLES = [
  '1. Adım: Birinci okuma ve Okuma hızı belirleme',
  '2. Adım: Okuma hızı',
  '3. Adım: Okuma hedefi belirleme',
];

const LEVEL3_TITLES = [
  '1. Adım: Model okuma ve İkinci okuma',
  '2. Adım: Üçüncü okuma ve okuma hızı belirleme',
  '3. Adım: Okuma hızı ve Performans geribildirimi',
];

const LEVEL4_TITLES = [
  '1. Adım: Dolu Şema Üzerinden Beyin Fırtınası ve Yorum',
  '2. Adım: Özetleme',
  'Tamamlama',
];

const LEVEL5_TITLES = [
  '1. Adım: Okuduğunu anlama soruları',
  '2. Adım: Hedefe bağlı ödül',
  '3. Adım: Çalışmayı sonlandırma',
];

export default function LevelRouter() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);

  const levelStr = params.level || '1';
  const stepStr = params.step || '1';
  const level = Number(levelStr);
  const step = Number(stepStr);
  // storyId must come from URL params, never use level as fallback
  const storyId = Number(searchParams.get('storyId')) || 1; // Default to 1 if not provided

  const totalSteps = LEVEL_STEPS_COUNT[level] || 1;

  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const appMode = getAppMode();

  // Fetch story title
  useEffect(() => {
    const fetchStoryTitle = async () => {
      try {
        const { data, error } = await getStoryById(storyId);
        if (!error && data) {
          setStoryTitle(data.title);
        } else {
          // Fallback to FALLBACK_STORIES if Supabase fails
          const FALLBACK_STORIES: Record<number, string> = {
            1: 'Kırıntıların Kahramanları',
            2: 'Avucumun İçindeki Akıllı Kutu',
            3: 'Hurma Ağacı',
            4: 'Akdeniz Bölgesi',
            5: 'Çöl Gemisi',
          };
          setStoryTitle(FALLBACK_STORIES[storyId] || `Oturum ${storyId}`);
        }
      } catch (err) {
        console.error('Error fetching story title:', err);
        setStoryTitle(`Oturum ${storyId}`);
      }
    };

    if (storyId) {
      fetchStoryTitle();
    }
  }, [storyId]);

  // Initialize session and check step completion on mount/change
  useEffect(() => {
    if (!student) return;

    let isMounted = true;

    const initializeSession = async () => {
      try {
        // Get or create active session
        const { data: activeSession } = await getActiveSession(student.id, storyId);
        
        let currentSessionId = sessionId;
        
        if (activeSession) {
          currentSessionId = activeSession.id;
          if (isMounted) setSessionId(activeSession.id);
        } else if (!sessionId) {
          // Create new session only if we don't have one
          const { data: newSession, error } = await createSession(student.id, storyId);
          if (!error && newSession) {
            currentSessionId = newSession.id;
            if (isMounted) setSessionId(newSession.id);
            await logStudentAction(newSession.id, student.id, 'session_started', storyId, level, step);
          }
        } else {
          currentSessionId = sessionId;
        }

        // Mark step as started
        if (currentSessionId) {
          await markStepStarted(currentSessionId, student.id, storyId, level, step);
        }

        // Check if step is completed
        const completed = await isStepCompleted(student.id, storyId, level, step, currentSessionId);
        if (isMounted) {
          setStepCompleted(completed);
          setIsCheckingCompletion(false);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        if (isMounted) setIsCheckingCompletion(false);
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [student?.id, storyId, level, step]); // sessionId'i dependency'den çıkardık

  const goToStep = (s: number) => {
    stopAllMedia();
    // Preserve query parameters (like storyId)
    const queryString = searchParams.toString();
    const url = queryString ? `/level/${level}/step/${s}?${queryString}` : `/level/${level}/step/${s}`;
    navigate(url);
    // Reset completion status when navigating
    setStepCompleted(false);
    setIsCheckingCompletion(true);
  };

  const onPrev = () => {
    if (step > 1) goToStep(step - 1);
  };

  const onNext = async () => {
    if (!student) return;

    // In prod mode, check if step is completed
    if (appMode === 'prod' && !stepCompleted) {
      alert('Bu adımı tamamlamadan bir sonraki adıma geçemezsiniz.');
      return;
    }

    setIsSaving(true);
    try {
      // Special case: Level 2 Step 4 (Summary) should go to completion page
      if (level === 2 && step === 4) {
        const nextLevel = level + 1;
        if (nextLevel <= 5) {
          // Complete current level and move to next level
          await updateStudentProgressStep(student.id, storyId, nextLevel, 1, level);
          
          // Log level completion
          if (sessionId) {
            await logStudentAction(sessionId, student.id, 'level_completed', storyId, level, step, {
              completed_level: level,
              next_level: nextLevel
            });
          }
          
          // Navigate to completion page
          navigate(`/level/2/completion?storyId=${storyId}`);
        }
        return;
      }

      // Special case: Level 3 Step 3 should go to completion page
      if (level === 3 && step === 3) {
        const nextLevel = level + 1;
        if (nextLevel <= 5) {
          // Complete current level and move to next level
          await updateStudentProgressStep(student.id, storyId, nextLevel, 1, level);
          
          // Log level completion
          if (sessionId) {
            await logStudentAction(sessionId, student.id, 'level_completed', storyId, level, step, {
              completed_level: level,
              next_level: nextLevel
            });
          }
          
          // Navigate to completion page
          navigate(`/level/3/completion?storyId=${storyId}`);
        }
        return;
      }

      // If this is the last step of the level, complete the level and move to next level
      if (step === totalSteps) {
        const nextLevel = level + 1;
        if (nextLevel <= 5) {
          // Complete current level and move to next level
          await updateStudentProgressStep(student.id, storyId, nextLevel, 1, level);
          
          // Log level completion
          if (sessionId) {
            await logStudentAction(sessionId, student.id, 'level_completed', storyId, level, step, {
              completed_level: level,
              next_level: nextLevel
            });
          }
          
          // Navigate to next level intro screen
          navigate(`/level/${nextLevel}/intro?storyId=${storyId}`);
        } else {
          // All levels completed (level 5), go to story completion screen
          await updateStudentProgressStep(student.id, storyId, level, step);
          // Mark story as completed
          if (sessionId) {
            await completeStory(student.id, storyId);
            await logStudentAction(sessionId, student.id, 'story_completed', storyId, level, step);
          }
          navigate(`/story/${storyId}/completion`);
        }
      } else {
        // Not last step, just move to next step
        // Update progress to next step (step + 1)
        const nextStep = step + 1;
        await updateStudentProgressStep(student.id, storyId, level, nextStep);
        
        // Log action
        if (sessionId) {
          await logStudentAction(sessionId, student.id, 'step_navigation', storyId, level, step, {
            from_step: step,
            to_step: nextStep
          });
        }
        
        goToStep(nextStep);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to mark step as completed (called by step components)
  const handleStepCompleted = async (completionData?: any) => {
    if (!student || !sessionId) return;

    try {
      const { error } = await markStepCompleted(
        sessionId,
        student.id,
        storyId,
        level,
        step,
        completionData
      );

      if (!error) {
        setStepCompleted(true);
        await logStudentAction(sessionId, student.id, 'step_completed', storyId, level, step, completionData);
        
        // If story is completed (level 5, step 3), mark story as completed
        if (completionData?.storyCompleted && level === 5 && step === 3) {
          const { error: completeError } = await completeStory(student.id, storyId);
          if (!completeError) {
            // End session
            await endSession(sessionId);
            await logStudentAction(sessionId, student.id, 'story_completed', storyId, level, step);
          }
        }
      }
    } catch (err) {
      console.error('Error marking step completed:', err);
    }
  };

  let content: React.ReactNode = null;
  if (level === 1) {
    if (step === 1) content = <Step1 />;
    else if (step === 2) content = <Step2 />;
    else if (step === 3) content = <Step3 />;
    else if (step === 4) content = <Step4 />;
    else if (step === 5) content = <Step5 />;
  } else if (level === 2) {
    if (step === 1) content = <L2Step1 />;
    else if (step === 2) content = <L2Step2 />;
    else if (step === 3) content = <L2Step3 />;
    else if (step === 4) content = <L2Step4 />;
  } else if (level === 3) {
    if (step === 1) content = <L3Step1 />;
    else if (step === 2) content = <L3Step2 />;
    else if (step === 3) content = <L3Step3 />;
  } else if (level === 4) {
    if (step === 1) content = <L4Step1 />;
    else if (step === 2) content = <L4Step2 />;
    else if (step === 3) content = <L4Step4 />;
  } else if (level === 5) {
    if (step === 1) content = <L5Step1 />;
    else if (step === 2) content = <L5Step2 />;
    else if (step === 3) content = <L5Step3 />;
  }

  if (!content) {
    content = (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Bu adım henüz hazır değil</h2>
        <p className="text-lg text-gray-600">Farklı bir adıma geçebilirsin.</p>
      </div>
    );
  }

  const renderLevelChecklist = (titles: string[]) => {
    const canJump = getApiEnv() === 'test';
    return (
      <div className="bg-green-50 border-b border-green-200 py-3 px-6 -mt-4 mb-2">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Adım Durumu:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {titles.map((title, i) => {
              const isCurrent = i + 1 === step;
              const isDone = i + 1 < step;
              const go = () => { if (canJump) goToStep(i + 1); };
              return (
                <div key={i} className={`flex items-center gap-2 ${canJump ? 'cursor-pointer' : ''}`} onClick={go}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isDone ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'border-purple-500 bg-purple-100' : 'border-gray-300'
                  }`}>
                    {isDone ? '✓' : isCurrent ? '●' : ''}
                  </div>
                  <span className={`text-sm ${
                    isDone ? 'text-green-700 line-through' : isCurrent ? 'text-purple-700 font-medium' : 'text-gray-500'
                  }`}>
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // In prod mode, disable next button if step is not completed
  const canProceed = appMode === 'dev' || stepCompleted || isCheckingCompletion;

  return (
    <StepProvider
      sessionId={sessionId}
      storyId={storyId}
      level={level}
      step={step}
      onStepCompleted={handleStepCompleted}
    >
      <StepLayout
        currentStep={step}
        totalSteps={totalSteps}
        onPrev={onPrev}
        onNext={onNext}
        hideNext={step === totalSteps} // Hide Next button on last step (Tamamla button will be shown instead)
        hideFooter={level === 2 && step === 3 ? true : false} // Hide footer for Level 2 Step 3 (auto-navigation), show for Step 4
        disableNext={!canProceed}
        stepCompleted={stepCompleted}
        onStepCompleted={handleStepCompleted}
        storyTitle={storyTitle}
        level={level}
      >
        {level === 1 ? (step === 5 ? null : renderLevelChecklist(LEVEL1_TITLES)) : null}
        {level === 2 ? renderLevelChecklist(LEVEL2_TITLES) : null}
        {level === 3 ? renderLevelChecklist(LEVEL3_TITLES) : null}
        {level === 4 ? renderLevelChecklist(LEVEL4_TITLES) : null}
        {level === 5 ? renderLevelChecklist(LEVEL5_TITLES) : null}
        {content}
      </StepLayout>
    </StepProvider>
  );
}
