// React 19: no default import required
import { useRef } from 'react';
import { playSoundEffect } from '../../lib/soundEffects';

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
  hideNext?: boolean;
  hidePrev?: boolean; // Geri/prev butonunu gizle (tüm seviyelerde)
  hideFooter?: boolean;
  disableNext?: boolean; // Next butonunu devre dışı bırak (adım tamamlanmadıysa)
  stepCompleted?: boolean; // Adım tamamlandı mı?
  onStepCompleted?: (completionData?: any) => void; // Adım tamamlandığında çağrılacak callback
  storyTitle?: string; // Hikaye adı
  level?: number; // Seviye numarası
}

export default function StepLayout({ 
  currentStep, 
  totalSteps, 
  onPrev, 
  onNext, 
  children, 
  hideNext = false, 
  hidePrev = false,
  hideFooter = false,
  disableNext = false,
  stepCompleted = false,
  onStepCompleted,
  storyTitle,
  level
}: Props) {
  const handlePrev = async () => {
    await playSoundEffect('whoosh');
    onPrev();
  };

  const handleNext = async () => {
    await playSoundEffect('pop');
    onNext();
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb] flex flex-col relative top-[-24px]">
      {/* Story Title and Level Info */}
      {(storyTitle || level) && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 px-6 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            {storyTitle && (
              <h1 className="text-lg md:text-xl font-bold text-center md:text-left">
                📚 {storyTitle}
              </h1>
            )}
            {level && (
              <div className="text-sm md:text-base bg-white/20 px-4 py-1 rounded-full">
                Seviye {level}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2 flex bg-gray-200">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 transition-all ${
              idx + 1 < currentStep ? 'bg-green-500' : idx + 1 === currentStep ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          ></div>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-center py-2 bg-gray-50">
        <span className="text-sm text-gray-600">Adım {currentStep} / {totalSteps}</span>
      </div>

      {/* Main Content with Nav */}
      <div className="relative flex-1">
        {/* Prev Button - Fixed to left edge (hidden when hidePrev) */}
        {!hidePrev && (
          <button
            onClick={handlePrev}
            disabled={currentStep <= 1}
            className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-r-full rounded-l-none p-6 text-3xl shadow-2xl z-50 hover:bg-green-600 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ 
              clipPath: 'polygon(0 0, 100% 10%, 100% 90%, 0 100%)',
              paddingLeft: '1.5rem',
              paddingRight: '2rem',
            }}
          >
            ←
          </button>
        )}

        <div className="w-full max-w-6xl mx-auto px-8 md:px-16 lg:px-24 py-4">
          {children}
        </div>

        {/* Next Button - Fixed to right edge */}
        {!hideNext && (
          <button
            onClick={handleNext}
            disabled={disableNext && currentStep < totalSteps}
            className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-l-full rounded-r-none p-6 text-3xl shadow-2xl z-50 hover:bg-green-600 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ 
              clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 10% 100%)',
              paddingLeft: '2rem',
              paddingRight: '1.5rem',
            }}
            title={disableNext && !stepCompleted && currentStep < totalSteps ? 'Bu adımı tamamlamadan devam edemezsiniz' : currentStep >= totalSteps ? 'Seviyeyi tamamla' : ''}
          >
            {currentStep >= totalSteps ? '🏠' : '→'}
          </button>
        )}
      </div>

      {/* Footer Nav - Tamamla Button (only on last step) */}
      {!hideFooter && currentStep >= totalSteps && (
        <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
          <button
            onClick={handleNext}
            disabled={disableNext && !stepCompleted}
            className="flex flex-col items-center bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-lg font-bold">TAMAMLA</div>
          </button>
        </div>
      )}
    </div>
  );
}
