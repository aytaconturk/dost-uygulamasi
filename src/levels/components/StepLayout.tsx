import React from 'react';

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}

export default function StepLayout({ currentStep, totalSteps, onPrev, onNext, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f9f9fb] flex flex-col relative top-[-24px]">
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

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-5 text-2xl shadow-lg z-10 hover:bg-green-600 transition-all hover:scale-105 disabled:opacity-50"
        >
          {currentStep >= totalSteps ? '🏠' : '→'}
        </button>
      </div>

      {/* Footer Nav */}
      <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
        {currentStep >= totalSteps && (
          <a
            href="/"
            className="flex flex-col items-center bg-purple-500 hover:bg-purple-600 text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-lg font-bold">TAMAMLA</div>
          </a>
        )}
      </div>
    </div>
  );
}
