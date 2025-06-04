import { useState } from 'react';
import DostMaskot from './DostMascot';
import VoiceRecorder from './VoiceRecorder';
import ProgressBar from './ProgressBar';
import { Step, AudioResponse } from '../types';

const Level1Steps = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userGuess, setUserGuess] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // TypeScript tip tanımlı adımlar
  const steps: Step[] = [
    {
      id: 1,
      type: 'image',
      prompt: "Bu görselde neler görüyorsun? Karıncalar ne yapıyor olabilir?",
    },
    {
      id: 2,
      type: 'title',
      prompt: "Başlık 'Büyük İşler Küçük Dostlar' diyor. Sence neden?",
      options: ["Çok çalışkanlar!", "Şeker severler!", "Toprağa faydalılar!"]
    },
    {
      id: 3,
      type: 'audio',
      prompt: "Karıncalar hakkında düşüncelerini sesinle kaydet!"
    }
  ];

  const handleAudioSubmit = (audioBlob: Blob | null) => {
    // API'ye ses gönderme simülasyonu
    console.log("Ses dosyası gönderildi:", audioBlob);
    setFeedback("Kaydın başarıyla alındı!");
    setCurrentStep(4);
  };

  return (
    <div className="level-container">
      <ProgressBar totalSteps={steps.length} currentStep={currentStep} />
      
      {/* Adım 1: Görsel Tahmini */}
      {currentStep === 1 && (
        <div className="step">
          <img 
            src="/assets/karinca-yuvasi.jpg" 
            alt="Karınca yuvası" 
            className="step-image" 
          />
          <DostMaskot text={steps[0].prompt} />
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Tahminini yaz..."
            className="child-input"
          />
          <button 
            onClick={() => setCurrentStep(2)}
            disabled={!userGuess.trim()}
          >
            İleri
          </button>
        </div>
      )}

      {/* Adım 2: Başlık Analizi */}
      {currentStep === 2 && (
        <div className="step">
          <h2 className="title">Büyük İşler Küçük Dostlar</h2>
          <DostMaskot text={steps[1].prompt} />
          {steps[1].options?.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                setUserGuess(option);
                setCurrentStep(3);
              }}
              className="option-button"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Adım 3: Ses Kaydı */}
      {currentStep === 3 && (
        <div className="step">
          <DostMaskot text={steps[2].prompt} />
          <VoiceRecorder onSave={handleAudioSubmit} />
          {feedback && <p className="feedback">{feedback}</p>}
        </div>
      )}

      {/* Adım 4: Tamamlama */}
      {currentStep === 4 && (
        <div className="completion-screen">
          <h3>🎉 1. Seviye Tamamlandı!</h3>
          <p>Karıncalar hakkında çok şey öğrendin!</p>
        </div>
      )}
    </div>
  );
};

export default Level1Steps;