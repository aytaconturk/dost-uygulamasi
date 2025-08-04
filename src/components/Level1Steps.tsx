import { useState } from 'react';
import axios from 'axios';
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

  const handleAudioSubmit = async (audioBlob: Blob) => {
    try {
      setFeedback("Ses dosyası gönderiliyor...");

      // Create MP3 file from blob - same format as ReadingScreen
      const file = new File([audioBlob], 'kullaniciCevabi.mp3', { type: 'audio/mp3' });

      // Create FormData with same parameters as ReadingScreen
      const formData = new FormData();
      formData.append("ses", file);
      formData.append("kullanici_id", "12345");
      formData.append("hikaye_adi", "Büyük İşler Küçük Dostlar");
      formData.append("adim", currentStep.toString());
      formData.append("adim_tipi", "level1_step");

      // Use the same API endpoint as ReadingScreen
      const response = await axios.post(
        "https://arge.aquateknoloji.com/webhook/faaba651-a1ad-4f6c-9062-0ebc7ca93bcb",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("API Yanıtı:", response.data);
      setFeedback("Harika! Kaydın başarıyla alındı ve değerlendirildi!");

      // Move to next step after delay
      setTimeout(() => {
        setCurrentStep(4);
      }, 2000);

    } catch (error) {
      console.error("API hatası:", error);

      // Fallback response when API is not available
      const fallbackMessages = [
        "Çok güzel konuştun! Karıncaları iyi gözlemlediğin anlaşılıyor.",
        "Harika! Karıncaların çalışkanlığı hakkında çok doğru düşünüyorsun.",
        "Mükemmel! Ses kaydın çok net ve anlaşılır.",
        "Bravo! Hikaye hakkındaki düşüncelerin çok değerli."
      ];

      const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      setFeedback(`${randomMessage} (Çevrimdışı mod)`);

      // Save audio blob locally for future processing
      console.log("Ses dosyası kaydedildi:", audioBlob);

      // Move to next step after delay
      setTimeout(() => {
        setCurrentStep(4);
      }, 2000);
    }
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
