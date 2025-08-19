import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import VoiceRecorder from './VoiceRecorder';

interface Story {
    id: number;
    title: string;
    description: string;
    image: string;
}

interface Props {
    stories?: Story[];
}

export default function Level1Steps({ stories }: Props) {
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [stepStarted, setStepStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(4).fill(false));
    const [stepCompleted, setStepCompleted] = useState(false);
    const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');
    
    // API related states
    const [imageAnalysisText, setImageAnalysisText] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [childrenVoiceResponse, setChildrenVoiceResponse] = useState<string>('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

    const steps = [
        {
            title: "1. Adım: Metnin görselini inceleme ve tahminde bulunma",
            text: "1. Seviye ile başlıyoruz. Bu seviyenin ilk basamağında metnin görselini inceleyeceğiz ve görselden yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.",
            audio: "/audio/1.seviye-1.adim.mp3",
            prompt: "Görseli inceleyerek hikayenin ne hakkında olabileceğini tahmin et. Neler gözlemliyorsun?",
            type: "observation"
        },
        {
            title: "2. Adım: Metni sesli okuma",
            text: "Şimdi hikayeyi sesli bir şekilde okuyacağız. Kelimeleri doğru telaffuz etmeye ve anlamlı bir şekilde okumaya odaklanacağız.",
            audio: "/audio/story1.mp3",
            prompt: "Hikayeyi sesli bir şekilde oku. Duraklamalara dikkat et ve net bir şekilde telaffuz et.",
            type: "reading"
        },
        {
            title: "3. Adım: Anlam çıkarma ve ana fikri bulma",
            text: "Okuduğumuz hikayenin ana fikrini ve mesajını anlamaya çalışacağız. Hikayedeki önemli detayları belirleyeceğiz.",
            audio: "/audio/sampleSes.mp3",
            prompt: "Hikayenin ana fikrini açıkla. Hikayede en önemli olay neydi? Ana karakterler kimlerdi?",
            type: "comprehension"
        },
        {
            title: "4. Adım: Sözcük dağarcığını geliştirme",
            text: "Hikayedeki yeni kelimeleri keşfedecek ve anlamlarını öğreneceğiz. Bu kelimeler vocabularımızı zenginleştirecek.",
            audio: "/audio/sampleSes.mp3",
            prompt: "Hikayede öğrendiğin yeni kelimeleri söyle. Bu kelimelerin anlamlarını açıkla.",
            type: "vocabulary"
        }
    ];

    const story = {
        id: 1,
        title: 'Büyük İşler Küçük Dostlar',
        description: 'Karıncalar hakkında',
        image: 'https://dost.muhbirai.com/src/assets/images/story1.png'
    };

    // Initial audio playback for step introduction
    useEffect(() => {
        if (stepStarted && audioRef.current && !imageAnalysisText) {
            audioRef.current.src = steps[currentStep].audio;
            setMascotState('speaking');
            audioRef.current.play().then(() => {
                audioRef.current!.addEventListener('ended', () => {
                    setMascotState('listening');
                    // After audio ends, trigger image analysis for step 1
                    if (currentStep === 0) {
                        handleImageAnalysis();
                    }
                }, { once: true });
            }).catch(err => console.error('Ses çalma hatası:', err));
        }
    }, [stepStarted, currentStep]);

    // Handle image analysis API call
    const handleImageAnalysis = async () => {
        console.log('🚀 Görsel analizi API isteği başlatılıyor...');
        setIsAnalyzing(true);
        
        try {
            console.log('📤 API endpoint:', 'https://arge.aquateknoloji.com/webhook-test/dost/level1');
            console.log('📤 Gönderilen data:', { imageUrl: story.image });
            
            const response = await axios.post(
                'https://arge.aquateknoloji.com/webhook-test/dost/level1',
                {
                    imageUrl: story.image
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Görsel analizi API yanıtı:', response.data);
            const analysisText = response.data.message || response.data.text || response.data.response || 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
            setImageAnalysisText(analysisText);
            
            // Convert text to speech and play it automatically
            speakText(analysisText);
            
        } catch (error) {
            console.error('❌ Görsel analizi API hatası:', error);
            
            // Fallback analysis text
            const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar. Onlar bizim için çok önemli örneklerdir.';
            setImageAnalysisText(fallbackText);
            
            // Convert fallback text to speech
            speakText(fallbackText);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Text-to-speech function
    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            setMascotState('speaking');
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'tr-TR';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            utterance.onend = () => {
                setMascotState('listening');
            };
            
            utterance.onerror = () => {
                setMascotState('listening');
                console.error('Text-to-speech hatası');
            };
            
            speechSynthesis.speak(utterance);
        }
    };

    const handleReplay = () => {
        if (audioRef.current) {
            setMascotState('speaking');
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => {
                audioRef.current!.addEventListener('ended', () => {
                    setMascotState('listening');
                }, { once: true });
            });
        }
    };

    // Handle voice recording submission to children voice API
    const handleVoiceSubmit = async (audioBlob: Blob) => {
        console.log('🎤 Çocuk sesi API\'ye gönderiliyor...');
        setIsProcessingVoice(true);
        
        try {
            const file = new File([audioBlob], 'cocuk_sesi.mp3', { type: 'audio/mp3' });
            const formData = new FormData();
            formData.append("ses", file);
            formData.append("kullanici_id", "12345");
            formData.append("hikaye_adi", story.title);
            formData.append("adim", "1");
            formData.append("adim_tipi", "gorsel_tahmini");

            console.log('📤 Çocuk sesi API endpoint:', 'https://arge.aquateknoloji.com/webhook-test/dost/level1/children-voice');
            
            const response = await axios.post(
                'https://arge.aquateknoloji.com/webhook-test/dost/level1/children-voice',
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            console.log('✅ Çocuk sesi API yanıtı:', response.data);
            
            const responseText = response.data.message || response.data.text || response.data.response || 'Çok güzel gözlemler! Karıncaları gerçekten iyi incelemişsin. Onların çalışkanlığı hakkındaki düşüncelerin çok değerli.';
            setChildrenVoiceResponse(responseText);
            
            // Speak the response
            speakText(responseText);
            
            // Mark step as completed
            setStepCompleted(true);
            const newCompletedSteps = [...completedSteps];
            newCompletedSteps[currentStep] = true;
            setCompletedSteps(newCompletedSteps);
            
        } catch (error) {
            console.error('❌ Çocuk sesi API hatası:', error);
            
            // Fallback response
            const fallbackText = 'Çok güzel konuştun! Karıncaları iyi gözlemlediğin anlaşılıyor. (Çevrimdışı mod)';
            setChildrenVoiceResponse(fallbackText);
            speakText(fallbackText);
            
            // Mark step as completed
            setStepCompleted(true);
            const newCompletedSteps = [...completedSteps];
            newCompletedSteps[currentStep] = true;
            setCompletedSteps(newCompletedSteps);
        } finally {
            setIsProcessingVoice(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setStepStarted(false);
            setStepCompleted(false);
            setImageAnalysisText('');
            setChildrenVoiceResponse('');
        } else {
            // All steps completed
            navigate('/');
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setStepStarted(false);
            setStepCompleted(false);
            setImageAnalysisText('');
            setChildrenVoiceResponse('');
        } else {
            navigate(`/story/1`);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f9fb] flex flex-col relative top-[-24px]">
            <audio ref={audioRef} preload="auto" />

            {/* Progress Bar */}
            <div className="w-full h-2 flex bg-gray-200">
                {steps.map((_, stepIndex) => (
                    <div
                        key={stepIndex}
                        className={`flex-1 transition-all ${
                            stepIndex < currentStep ? 'bg-green-500' :
                            stepIndex === currentStep ? 'bg-purple-600' :
                            'bg-gray-300'
                        }`}
                    ></div>
                ))}
            </div>

            {/* Step Counter */}
            <div className="text-center py-2 bg-gray-50">
                <span className="text-sm text-gray-600">
                    Adım {currentStep + 1} / {steps.length}
                </span>
            </div>

            {/* Step Title */}
            <div className="bg-white border-b-2 border-purple-200 py-4 px-6">
                <h1 className="text-2xl font-bold text-purple-800 text-center">
                    {steps[currentStep].title}
                </h1>
            </div>

            {/* Completed Steps Checklist */}
            {completedSteps.some(completed => completed) && (
                <div className="bg-green-50 border-b border-green-200 py-3 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-sm font-semibold text-green-800 mb-2">Tamamlanan Adımlar:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        completedSteps[index]
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : index === currentStep
                                            ? 'border-purple-500 bg-purple-100'
                                            : 'border-gray-300'
                                    }`}>
                                        {completedSteps[index] && '✓'}
                                        {index === currentStep && !completedSteps[index] && '●'}
                                    </div>
                                    <span className={`text-sm ${
                                        completedSteps[index]
                                            ? 'text-green-700 line-through'
                                            : index === currentStep
                                            ? 'text-purple-700 font-medium'
                                            : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step Start Screen */}
            {!stepStarted && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-semibold text-purple-800 mb-4 text-center max-w-2xl">
                        {steps[currentStep].title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-6 text-center max-w-2xl">
                        {steps[currentStep].text}
                    </p>
                    <button
                        onClick={() => setStepStarted(true)}
                        className="bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold"
                    >
                        Başla
                    </button>
                </div>
            )}

            {/* Main Content Screen */}
            {stepStarted && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex-1 flex flex-col items-center justify-center relative mt-0"
                >
                    {/* Navigation Buttons */}
                    <button
                        onClick={handlePrevStep}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded-full p-4 text-xl shadow-md z-10 hover:bg-green-300 transition-colors"
                        disabled={currentStep === 0 && stepStarted}
                    >
                        ←
                    </button>

                    <button
                        onClick={handleNextStep}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded-full p-4 text-xl shadow-md z-10 hover:bg-green-300 transition-colors disabled:opacity-50"
                        disabled={!stepCompleted && stepStarted}
                    >
                        {currentStep === steps.length - 1 ? '🏠' : '→'}
                    </button>

                    {/* Content Layout */}
                    <div className="w-full max-w-6xl mx-auto px-4">
                        {/* Step 1: Image Analysis Phase */}
                        {currentStep === 0 && (
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                {/* Image Section */}
                                <div className={`${imageAnalysisText ? 'lg:w-1/2' : 'w-full'} transition-all duration-500`}>
                                    <div className="relative">
                                        <img
                                            src={story.image}
                                            alt={story.title}
                                            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                                        />
                                        
                                        {/* Loading overlay during analysis */}
                                        {isAnalyzing && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                                    <p className="font-bold">DOST görseli analiz ediyor...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Image analysis result */}
                                    {imageAnalysisText && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Görsel Analizi:</h3>
                                            <p className="text-blue-700">{imageAnalysisText}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Task Section - Only show after image analysis */}
                                {imageAnalysisText && (
                                    <div className="lg:w-1/2 w-full">
                                        <div className="bg-white rounded-xl shadow-lg p-6">
                                            <div className="bg-orange-50 rounded-lg border-l-4 border-orange-400 p-4 mb-6">
                                                <p className="text-orange-800 font-medium">Görev:</p>
                                                <p className="text-orange-700 text-lg">{steps[currentStep].prompt}</p>
                                            </div>

                                            {/* Voice Recorder */}
                                            {!childrenVoiceResponse && (
                                                <div className="text-center">
                                                    <p className="mb-4 text-xl font-bold text-green-700 animate-pulse">
                                                        Hadi sıra sende! Mikrofona konuş
                                                    </p>
                                                    <VoiceRecorder onSave={handleVoiceSubmit} />
                                                    {isProcessingVoice && (
                                                        <p className="mt-4 text-blue-600 font-medium">
                                                            DOST senin sözlerini değerlendiriyor...
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* DOST's Response to Child's Voice */}
                                            {childrenVoiceResponse && (
                                                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <h3 className="font-bold text-green-800 mb-2">🗣️ DOST'un Yorumu:</h3>
                                                    <p className="text-green-700 text-lg">{childrenVoiceResponse}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Other Steps - Placeholder for now */}
                        {currentStep > 0 && (
                            <div className="text-center py-12">
                                <h2 className="text-2xl font-bold text-purple-800 mb-4">
                                    {steps[currentStep].title}
                                </h2>
                                <p className="text-lg text-gray-600 mb-6">
                                    Bu adım henüz geliştirilmekte...
                                </p>
                                <button
                                    onClick={() => {
                                        setStepCompleted(true);
                                        const newCompletedSteps = [...completedSteps];
                                        newCompletedSteps[currentStep] = true;
                                        setCompletedSteps(newCompletedSteps);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
                                >
                                    Bu Adımı Tamamla
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Interactive DOST Mascot */}
            <div
                className="fixed bottom-2 right-8 z-20 cursor-pointer transform hover:scale-105 transition-all duration-200"
                onClick={handleReplay}
            >
                <div className="relative">
                    <img
                        src="/src/assets/images/maskot-boy.png"
                        alt="DOST Maskot"
                        className={`w-56 md:w-64 transition-all duration-300 ${
                            mascotState === 'speaking' ? 'animate-bounce' : ''
                        }`}
                    />

                    {/* Speaking Animation Overlay */}
                    {mascotState === 'speaking' && (
                        <div className="absolute top-4 right-4 animate-pulse">
                            <div className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                                🗣️ DOST konuşuyor
                            </div>
                        </div>
                    )}

                    {/* Listening Mode Overlay */}
                    {mascotState === 'listening' && (
                        <div className="absolute top-4 right-4">
                            <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                                👂 DOST dinliyor
                            </div>
                        </div>
                    )}

                    {/* Click hint when in listening mode */}
                    {mascotState === 'listening' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold animate-bounce shadow-lg">
                            📱 Tekrar dinlemek için tıkla!
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Navigation Buttons */}
            <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
                {stepCompleted && currentStep < steps.length - 1 && (
                    <button
                        onClick={handleNextStep}
                        className="flex flex-col items-center bg-green-500 hover:bg-green-600 text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
                    >
                        <div className="text-4xl mb-2">➡️</div>
                        <div className="text-lg font-bold">SONRAKİ ADIM</div>
                    </button>
                )}

                {stepCompleted && currentStep === steps.length - 1 && (
                    <button
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center bg-purple-500 hover:bg-purple-600 text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
                    >
                        <div className="text-4xl mb-2">🏆</div>
                        <div className="text-lg font-bold">TAMAMLA</div>
                    </button>
                )}
            </div>
        </div>
    );
}
