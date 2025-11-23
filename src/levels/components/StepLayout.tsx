// React 19: no default import required

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
  hideNext?: boolean;
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
  hideFooter = false,
  disableNext = false,
  stepCompleted = false,
  onStepCompleted,
  storyTitle,
  level
}: Props) {
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
        <button
          onClick={onPrev}
          disabled={currentStep <= 1}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-5 text-2xl shadow-lg z-10 hover:bg-green-600 transition-all hover:scale-105 disabled:opacity-50"
        >
          ←
        </button>

        <div className="w-full max-w-6xl mx-auto px-8 md:px-16 lg:px-24 py-4">
          {children}
        </div>

        {!hideNext && (
          <button
            onClick={onNext}
            disabled={disableNext && currentStep < totalSteps}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-5 text-2xl shadow-lg z-10 hover:bg-green-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title={disableNext && !stepCompleted && currentStep < totalSteps ? 'Bu adımı tamamlamadan devam edemezsiniz' : currentStep >= totalSteps ? 'Seviyeyi tamamla' : ''}
          >
            {currentStep >= totalSteps ? '🏠' : '→'}
          </button>
        )}
      </div>

      {/* Footer Nav */}
      {!hideFooter && (
        <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
          {currentStep >= totalSteps && (
            <button
              onClick={onNext}
              disabled={disableNext}
              className="flex flex-col items-center bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-lg font-bold">TAMAMLA</div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
