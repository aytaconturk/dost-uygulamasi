import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBase } from '../lib/api';
import { motion } from 'framer-motion';

interface Story {
    id: number;
    title: string;
    description: string;
    image: string;
}

interface Props {
    stories: Story[];
}

export default function ReadingScreen({ stories }: Props) {
    const { id } = useParams();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stepStarted, setStepStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [countdown, setCountdown] = useState(10);
    const [isRecording, setIsRecording] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(4).fill(false));
    const [stepCompleted, setStepCompleted] = useState(false);
    const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');

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

    const story:any = stories.find((s) => s.id === Number(id));

    useEffect(() => {
        if (stepStarted && audioRef.current) {
            audioRef.current.src = steps[currentStep].audio;
            setMascotState('speaking');
            audioRef.current.play().then(() => {
                // When audio starts playing
                audioRef.current!.addEventListener('ended', () => {
                    setMascotState('listening');
                });
            }).catch(err => console.error('Ses çalma hatası:', err));
        }
    }, [stepStarted, currentStep]);

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

    const handleRecord = async () => {
        setIsRecording(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/mp3' });
            const file = new File([blob], 'kullaniciCevabi.mp3', { type: 'audio/mp3' });

            const formData = new FormData();
            formData.append("ses", file);
            formData.append("kullanici_id", "12345");
            formData.append("hikaye_adi", story?.title || "");
            formData.append("adim", `${currentStep + 1}`);
            formData.append("adim_tipi", steps[currentStep].type);

            axios.post(
                `${getApiBase()}/faaba651-a1ad-4f6c-9062-0ebc7ca93bcb`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            ).then(res => {
                console.log("Yanıt:", res.data);
                setStepCompleted(true);
                const newCompletedSteps = [...completedSteps];
                newCompletedSteps[currentStep] = true;
                setCompletedSteps(newCompletedSteps);
            }).catch(err => console.error("Hata:", err));
        };

        mediaRecorder.start();

        let time = 10;
        setCountdown(time);
        const interval = setInterval(() => {
            time -= 1;
            setCountdown(time);
            if (time <= 0) {
                clearInterval(interval);
                mediaRecorder.stop();
                setIsRecording(false);
            }
        }, 1000);
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setStepStarted(false);
            setStepCompleted(false);
        } else {
            // Tüm adımlar tamamlandı
            navigate('/');
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setStepStarted(false);
            setStepCompleted(false);
        } else {
            navigate(`/story/${story.id}`);
        }
    };

    if (!story) return <p>Hikaye bulunamadı</p>;

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

            {/* Step Title - Prominent */}
            <div className="bg-white border-b-2 border-purple-200 py-4 px-6">
                <h1 className="text-2xl font-bold text-purple-800 text-center">
                    {steps[currentStep].title}
                </h1>
            </div>

            {/* Completed Steps Checklist */}
            {completedSteps.some(completed => completed) && (
                <div className="bg-green-50 border-b border-green-200 py-3 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-sm font-semibold text-green-800 mb-2">Tamamlanan Ad��mlar:</h3>
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

            {/* Başlık ekranı */}
            {!stepStarted && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                        {steps[currentStep].title}
                    </h2>
                    <button
                        onClick={() => setStepStarted(true)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-full shadow hover:bg-purple-700 transition"
                    >
                        Başla
                    </button>
                </div>
            )}

            {/* İçerik ekranı */}
            {stepStarted && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 px-4 md:px-16 relative mt-0"
                >
                    {/* Prev Button */}
                    <button
                        onClick={handlePrevStep}
                        className="absolute left-[-48px] top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-5 text-2xl shadow-lg z-10 hover:bg-green-600 transition-all hover:scale-105"
                        disabled={currentStep === 0 && stepStarted}
                    >
                        ←
                    </button>

                    <img
                        src={story.image}
                        alt={story.title}
                        className="w-64 md:w-80 rounded shadow"
                    />

                    <div className="max-w-xl text-lg text-gray-800 leading-relaxed">
                        <p className="mb-4 text-gray-700 font-medium">{story.description}</p>
                        <p className="mt-4 text-gray-800">{steps[currentStep].text}</p>

                        {/* Step-specific prompt */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-blue-800 font-medium">Görev:</p>
                            <p className="text-blue-700">{steps[currentStep].prompt}</p>
                        </div>

                        {stepCompleted && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-700 font-medium">✅ Bu adımı tamamladın! Bir sonraki adıma geçebilirsin.</p>
                            </div>
                        )}

                        {stepStarted && !isRecording && !stepCompleted && (
                            <div className="mt-6 text-center">
                                <p className="mb-4 text-2xl font-bold text-green-700 animate-pulse">Hadi sıra sende!</p>
                                <p className="text-lg text-green-600">Mikrofona tıklayarak cevabını ver</p>
                            </div>
                        )}

                        {/* Big Microphone Button for Children */}
                        {stepStarted && !isRecording && !stepCompleted && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handleRecord}
                                    className="relative w-32 h-32 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-2xl hover:from-red-500 hover:to-red-700 transform hover:scale-105 transition-all duration-200 active:scale-95"
                                >
                                    <div className="text-white text-6xl">🎤</div>
                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-lg font-bold text-red-600">KONUŞ</div>
                                </button>
                            </div>
                        )}

                        {/* Circular Countdown Timer */}
                        {isRecording && (
                            <div className="mt-6 flex justify-center">
                                <div className="relative w-40 h-40">
                                    {/* Background Circle */}
                                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="transparent"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                        />
                                        {/* Progress Circle */}
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="transparent"
                                            stroke="#ef4444"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 70}
                                            strokeDashoffset={2 * Math.PI * 70 * (countdown / 10)}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    {/* Center Content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-5xl mb-2">🎙️</div>
                                        <div className="text-3xl font-bold text-red-600">{countdown}</div>
                                        <div className="text-sm font-medium text-gray-600">saniye</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={handleNextStep}
                        className="absolute right-[-48px] top-1/2 transform -translate-y-1/2 bg-green-500 text-white rounded-full p-5 text-2xl shadow-lg z-10 hover:bg-green-600 transition-all hover:scale-105 disabled:opacity-50"
                        disabled={!stepCompleted && stepStarted}
                    >
                        {currentStep === steps.length - 1 ? '🏠' : '→'}
                    </button>
                </motion.div>
            )}

            {/* Footer - Child-Friendly Buttons */}
            <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
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

            {/* Interactive DOST Maskot */}
            <div
                className="fixed bottom-2 right-8 z-20 cursor-pointer transform hover:scale-105 transition-all duration-200"
                onClick={handleReplay}
            >
                <div className="relative">
                    {/* Base Mascot Image */}
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
                            {/* Speaking mouth animation */}
                            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                                <div className="w-6 h-4 bg-pink-400 rounded-full animate-ping"></div>
                            </div>
                        </div>
                    )}

                    {/* Listening Mode Overlay */}
                    {mascotState === 'listening' && (
                        <div className="absolute top-4 right-4">
                            <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                                👂 DOST dinliyor
                            </div>
                            {/* Listening hand to ear gesture */}
                            <div className="absolute top-16 right-8">
                                <div className="text-4xl animate-bounce">🤚</div>
                            </div>
                        </div>
                    )}

                    {/* Click hint when in listening mode */}
                    {mascotState === 'listening' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold animate-bounce shadow-lg">
                            📱 Tekrar dinlemek için tıkla!
                        </div>
                    )}

                    {/* Idle state hint */}
                    {mascotState === 'idle' && stepStarted && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            👋 Ben DOST!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
