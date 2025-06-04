import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
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

    const steps = [
        {
            title: "1. Adım: Metnin görselini inceleme ve tahminde bulunma",
            text: "1. Seviye ile başlıyoruz. Bu seviyenin ilk basamağında metnin görselini inceleyeceğiz ve görselden yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.",
            audio: "/audio/1.seviye-1.adim.mp3"
        }
    ];

    const story = stories.find((s) => s.id === Number(id));

    useEffect(() => {
        if (stepStarted && audioRef.current) {
            audioRef.current.src = steps[currentStep].audio;
            audioRef.current.play().catch(err => console.error('Ses çalma hatası:', err));
        }
    }, [stepStarted, currentStep]);

    const handleReplay = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
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

            axios.post(
                "https://arge.aquateknoloji.com/webhook/faaba651-a1ad-4f6c-9062-0ebc7ca93bcb",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            ).then(res => console.log("Yanıt:", res.data)).catch(err => console.error("Hata:", err));
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

    if (!story) return <p>Hikaye bulunamadı</p>;

    return (
        <div className="min-h-screen bg-[#f9f9fb] flex flex-col relative top-[-24px]">
            <audio ref={audioRef} preload="auto" />

            {/* Progress Bar */}
            <div className="w-full h-1 flex">
                {[0, 1, 2, 3].map((step) => (
                    <div
                        key={step}
                        className={`flex-1 transition-all ${step <= currentStep ? 'bg-purple-600' : 'bg-gray-300'}`}
                    ></div>
                ))}
            </div>

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
                    <button onClick={() => navigate(`/story/${story.id}`)}
                            className="absolute left-[-48px] top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded p-4 text-xl shadow-md z-10">
                        ←
                    </button>

                    <img
                        src={story.image}
                        alt={story.title}
                        className="w-64 md:w-80 rounded shadow"
                    />

                    <div className="max-w-xl text-lg text-gray-800 leading-relaxed">
                        <p className="mb-4 font-semibold text-purple-800 text-xl">{steps[currentStep].title}</p>
                        <p className="mb-2">{story.description}</p>
                        <p className="mt-4">{steps[currentStep].text}</p>
                        {stepStarted && !isRecording && (
                            <p className="mt-4 font-bold text-green-700 animate-pulse">Hadi sıra sende! Cevabını ver.</p>
                        )}
                        {isRecording && (
                            <p className="mt-2 font-mono text-red-600">⏱️ {countdown} saniye</p>
                        )}
                    </div>

                    {/* Next Button */}
                    <button className="absolute right-[-48px] top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded p-4 text-xl shadow-md z-10">
                        →
                    </button>
                </motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 px-6 py-4">
                <button onClick={handleRecord} className="bg-white border px-4 py-2 rounded-lg">🎙️ Konuş</button>
                <button onClick={handleReplay} className="bg-white border px-4 py-2 rounded-lg">🔁 Dinle</button>
            </div>

            {/* Maskot */}
            <div className="fixed bottom-2 right-1/12 z-20 cursor-pointer">
                <img src="/src/assets/images/maskot-boy.png" alt="Maskot" className="w-56 md:w-64" />
            </div>
        </div>
    );
}
