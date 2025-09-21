import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getApiBase } from '../lib/api';

export default function Level1Steps() {
    const allowFreeNav = true;
    const navigate = useNavigate();
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [stepStarted, setStepStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Array(4).fill(false));
    const [stepCompleted, setStepCompleted] = useState(false);
    const [mascotState, setMascotState] = useState('idle');
    
    // API related states
    const [imageAnalysisText, setImageAnalysisText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [childrenVoiceResponse, setChildrenVoiceResponse] = useState('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [resumeUrl, setResumeUrl] = useState('');
    const [audioPlaybackFinished, setAudioPlaybackFinished] = useState(false);
    const [typewriterFinished, setTypewriterFinished] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [fullAnalysisText, setFullAnalysisText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingIntervalRef = useRef(null);
    const audioElementRef = useRef(null);
    const currentAudioRef = useRef(null); // Track currently playing audio
    const microphonePromptAudioRef = useRef(null); // Track microphone prompt audio
    const [microphonePromptPlayed, setMicrophonePromptPlayed] = useState(false);
    const [initialAudioFinished, setInitialAudioFinished] = useState(false);
    const [apiResponseReady, setApiResponseReady] = useState(false);
    const [voiceResponseText, setVoiceResponseText] = useState('');
    const [isVoiceTyping, setIsVoiceTyping] = useState(false);
    const [storedAudioBase64, setStoredAudioBase64] = useState('');

    // Recording states like ReadingScreen
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(1);

    // Cleanup function to stop all audio when component unmounts or page changes
    useEffect(() => {
        return () => {
            console.log('🧹 Level1Steps cleanup: Stopping all audio');

            // Stop current audio
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current = null;
            }

            // Stop microphone prompt audio
            if (microphonePromptAudioRef.current) {
                microphonePromptAudioRef.current.pause();
                microphonePromptAudioRef.current.currentTime = 0;
                microphonePromptAudioRef.current = null;
            }

            // Stop media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            // Clear typing interval
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, []);

    // Play microphone prompt only when both audio and typewriter finish
    useEffect(() => {
        if ((currentStep === 0 || currentStep === 1) && audioPlaybackFinished && typewriterFinished) {
            console.log('🎯 Both audio and typewriter finished, playing microphone prompt');
            setTimeout(() => {
                playMicrophonePrompt();
            }, 1000);
        }
    }, [audioPlaybackFinished, typewriterFinished, currentStep]);

    const steps = [
        {
            title: "1. Adım: Metnin görselini inceleme ve tahminde bulunma",
            text: "1. Seviye ile başlıyoruz. Bu seviyenin ilk basamağında metnin görselini inceleyeceğiz ve görselden yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.",
            audio: "/src/assets/audios/level1/seviye-1-adim-1-fable.mp3",
            prompt: "Görseli inceleyerek hikayenin ne hakkında olabileceğini tahmin et. Neler gözlemliyorsun?",
            type: "observation"
        },
        {
            title: "2. Adım: Metnin başlığını inceleme ve tahminde bulunma",
            text: "Şimdi bu seviyenin ikinci basamağında metnin başlığ��nı inceleyeceğiz ve başlıktan yola çıkarak metnin içeriğine yönelik tahminde bulunacağız.",
            audio: "/src/assets/audios/level1/seviye-1-adim-2-fable.mp3",
            prompt: "Başlık 'Büyük İşler K��çük Dostlar' diyor. Bu başlıktan yola çıkarak hikayenin ne hakkında olabileceğini düşünüyor musun? Fikirlerini paylaş!",
            type: "title_prediction"
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
        image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png'
    };

    // Initial step trigger - parallel execution
    useEffect(() => {
        if (stepStarted && !imageAnalysisText && !fullAnalysisText) {
            // For steps 1 and 2, start both audio and API call in parallel
            if (currentStep === 0 || currentStep === 1) {
                setAudioPlaybackFinished(false);
                setDisplayedText('');
                setFullAnalysisText('');
                setIsTyping(false);
                setInitialAudioFinished(false);
                setApiResponseReady(false);
                setVoiceResponseText('');
                setIsVoiceTyping(false);
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
                // Start both audio and API call in parallel
                playInitialStepAudio();
                handleImageAnalysis();
            }
        }
    }, [stepStarted, currentStep]);

    // Trigger typewriter when fullAnalysisText is ready and audio is available
    useEffect(() => {
        if ((currentStep === 0 || currentStep === 1) && fullAnalysisText && audioElementRef.current && !isTyping) {
            const audio = audioElementRef.current;
            if (audio.duration) {
                console.log(`🎯 Triggering typewriter from useEffect for step ${currentStep + 1}`);
                startTypewriterEffect(audio.duration);
            } else {
                // Wait for audio to load
                const handleLoadedMetadata = () => {
                    console.log(`🎯 Audio loaded, triggering typewriter for step ${currentStep + 1}`);
                    startTypewriterEffect(audio.duration || 10);
                    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                };
                audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            }
        }
    }, [fullAnalysisText, currentStep]);

    // Coordinate initial audio and API response
    useEffect(() => {
        if ((currentStep === 0 || currentStep === 1) && initialAudioFinished && apiResponseReady && fullAnalysisText) {
            console.log(`🎯 Both initial audio and API ready for step ${currentStep + 1}`);
            console.log(`🔍 Stored audio base64 exists:`, !!storedAudioBase64, 'Length:', storedAudioBase64 ? storedAudioBase64.length : 0);

            // Now we can start the analysis audio and typewriter
            if (storedAudioBase64 && storedAudioBase64.length > 100) { // Ensure it's not just empty or tiny
                console.log('🎵 Playing audio from base64');
                playAudioFromBase64(storedAudioBase64);
            } else {
                console.log('🔇 No audio available, showing text immediately');
                // No audio, just show the text immediately
                setImageAnalysisText(fullAnalysisText);
                setAudioPlaybackFinished(true);
                setTypewriterFinished(true); // No typewriter needed, mark as finished
                setTimeout(() => {
                    playMicrophonePrompt();
                }, 1000);
            }
        }
    }, [initialAudioFinished, apiResponseReady, fullAnalysisText, currentStep]);

    // Handle image analysis API call with new combined response format
    const handleImageAnalysis = async () => {
        const stepNum = currentStep + 1;
        console.log(`🚀 ${stepNum}. adım API isteği başlatılıyor...`);
        setIsAnalyzing(true);

        try {
            // Determine endpoint based on step
            const endpoint = stepNum === 1
                ? `${getApiBase()}/dost/level1`
                : `${getApiBase()}/dost/level1/step${stepNum}`;

            console.log('📤 API endpoint:', endpoint);
            console.log('📤 Gönderilen data:', { imageUrl: story.image, step: stepNum });

            const response = await axios.post(
                endpoint,
                {
                    imageUrl: story.image,
                    step: stepNum
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                    // Expect JSON response with text and base64 audio
                }
            );

            console.log(`✅ ${stepNum}. adım API yanıtı alındı:`, response.data);
            console.log('🔍 Response keys:', Object.keys(response.data));

            // Extract data from response format
            const { title, imageExplanation, audioBase64, text, message, resumeUrl } = response.data;

            console.log('📝 Title:', title);
            console.log('📝 ImageExplanation:', imageExplanation);
            console.log('📝 Text:', text);
            console.log('📝 Message:', message);
            console.log('🎵 AudioBase64 available:', !!audioBase64);
            console.log('🔗 ResumeUrl:', resumeUrl);

            // Set resumeUrl if available
            if (resumeUrl) {
                setResumeUrl(resumeUrl);
                console.log('✅ ResumeUrl set:', resumeUrl);
            }

            // Set the text content - prioritize imageExplanation, then text/message
            const textContent = imageExplanation || text || message || `${stepNum}. adım analizi tamamlandı.`;

            // For steps 1 and 2, prepare for typewriter effect
            if (currentStep === 0 || currentStep === 1) {
                setFullAnalysisText(textContent);
                setDisplayedText('');
                setImageAnalysisText(''); // Clear initially
                setApiResponseReady(true);
                console.log(`🔤 API response ready for step ${currentStep + 1}, text length:`, textContent.length);
            } else {
                setImageAnalysisText(textContent);
            }

            // Play audio if available
            if (audioBase64) {
                console.log('🎵 Base64 audio bulundu, çal��nıyor...');
                playAudioFromBase64(audioBase64);
            } else {
                console.log('🔇 Audio bulunamadı, sessiz mod (text-to-speech kapalı)');
                // Text-to-speech disabled - only show text
            }

        } catch (error) {
            console.error(`❌ ${stepNum}. adım API hatası:`, error);

            // Step-specific fallback text
            const fallbackTexts = {
                1: 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.',
                2: 'Başlık "Büyük İşler Küçük Dostlar" karıncaların iş birliğini vurguluyor.',
                3: 'Hikayenin ana mesajı karıncalar��n birlik beraberlik içinde çalışmasıdır.',
                4: 'Bu hikayede öğrendiğimiz kelimeler: çalışkan, iş birliği, azim, başarı.'
            };

            const fallbackText = fallbackTexts[stepNum] || `${stepNum}. adım tamamlandı.`;
            setImageAnalysisText(fallbackText);
            console.log(`🔇 ${stepNum}. adım fallback text gösterildi, ses kapalı`);
            // Text-to-speech disabled for fallback

        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle JSON response (may contain text, audio data, or both)
    const handleJsonResponse = (data) => {
        console.log('🔍 JSON data keys:', Object.keys(data));

        // Check for text content
        const textContent = data.text || data.message || data.response || data.analysis;

        // Check for audio content
        const audioData = data.audio || data.audioData;
        const audioUrl = data.audioUrl || data.audio_url;
        const base64Audio = data.audioBase64 || data.base64;

        if (textContent) {
            console.log('📝 Text content found:', textContent);
            setImageAnalysisText(textContent);
        }

        // Priority: 1) Base64 audio, 2) Audio URL, 3) Text-to-speech
        if (base64Audio) {
            console.log('��� Base64 audio data found');
            playAudioFromBase64(base64Audio, textContent);
        } else if (audioUrl) {
            console.log('🎵 Audio URL found:', audioUrl);
            playAudioFromUrl(audioUrl);
        } else if (audioData && audioData.data) {
            console.log('🎵 Embedded audio data found');
            playAudioFromBase64(audioData.data, textContent);
        } else if (textContent) {
            console.log('🗣️ No audio found, text only mode');
    
        } else {
            console.log('❌ No usable content found in JSON response');
            handleFallbackResponse();
        }
    };

    // Handle multipart response
    const handleMultipartResponse = (data) => {
        console.log('📦 Handling multipart response...');
        // For now, treat as fallback - multipart parsing is complex
        handleFallbackResponse();
    };

    // Handle unknown or fallback responses
    const handleFallbackResponse = (data = null) => {
        console.log('🔄 Using fallback response');

        // Try to extract any text if it's a string
        let fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';

        if (typeof data === 'string') {
            fallbackText = data;
        } else if (data && (data.message || data.text || data.response)) {
            fallbackText = data.message || data.text || data.response;
        }

        setImageAnalysisText(fallbackText);

    };

    // Play audio from base64 encoded data
    const playAudioFromBase64 = async (base64Data) => {
        try {
            console.log('🎵 Converting base64 to audio...');
            console.log('🔍 Base64 data length:', base64Data.length);

            // Convert base64 to blob
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mp3' });

            console.log('🎵 Base64 converted to blob, size:', audioBlob.size);

            // Play the blob
            playAudioFromBlob(audioBlob);

        } catch (error) {
            console.error('❌ Base64 audio conversion error:', error);

            // Fallback - silent mode
            console.log('🔇 Base64 audio hatalı, sessiz mod');
            // Show text immediately and play microphone prompt
            setImageAnalysisText(fullAnalysisText);
            setAudioPlaybackFinished(true);
            setTypewriterFinished(true); // No typewriter needed, mark as finished
            setMascotState('listening');

            // Play microphone prompt after 1 second
            setTimeout(() => {
                playMicrophonePrompt();
            }, 1000);
        }
    };

    // Play audio directly from blob
    const playAudioFromBlob = async (audioBlob) => {
        try {
            console.log('🎵 Blob\'dan audio oynatma başlatılıyor:', audioBlob);
            setMascotState('speaking');

            // Create object URL from blob
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('🎵 Blob URL oluşturuldu:', audioUrl);

            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio; // Track current audio

            audio.onloadstart = () => {
                console.log('🎵 Audio y��klenmeye başladı');
            };

            audio.oncanplay = () => {
                console.log('🎵 Audio oynatılabilir durumda');
            };

            audio.onended = () => {
                console.log('🎵 Audio oynatma tamamlandı');
                setMascotState('listening');
                setAudioPlaybackFinished(true); // Mark audio as finished
                currentAudioRef.current = null; // Clear ref when audio ends
                setIsTyping(false);
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
                // Ensure full text is displayed
                if ((currentStep === 0 || currentStep === 1) && fullAnalysisText) {
                    setDisplayedText(fullAnalysisText);
                    setImageAnalysisText(fullAnalysisText);
                }
                URL.revokeObjectURL(audioUrl); // Clean up
            };

            audio.oncanplay = () => {
                console.log('🎵 Audio oynatılabilir durumda');
            };

            audio.onloadedmetadata = () => {
                console.log('🎵 Audio metadata yüklendi, duration:', audio.duration);
                // Start typewriter effect for steps 1 and 2 after a small delay
                if ((currentStep === 0 || currentStep === 1) && fullAnalysisText) {
                    setTimeout(() => {
                        startTypewriterEffect(audio.duration || 10);
                    }, 100);
                }
            };

            audioElementRef.current = audio;

            audio.onerror = (error) => {
                console.error('❌ Audio blob oynatma hatası:', error);
                console.error('��� Audio src:', audio.src);
                console.error('❌ Audio error details:', audio.error);
                setMascotState('listening');
                URL.revokeObjectURL(audioUrl); // Clean up

                // Fallback to text-to-speech
                const fallbackText = 'Bu görselde ��alışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
                setImageAnalysisText(fallbackText);
        
            };

            await audio.play();
            console.log('🎵 Audio.play() çağrıldı');

        } catch (error) {
            console.error('❌ Audio blob işleme hatası:', error);
            setMascotState('listening');

            // Fallback to text-to-speech
            const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
            setImageAnalysisText(fallbackText);
    
        }
    };

    // Simple audio playback from URL
    const playAudioFromUrl = async (audioUrl) => {
        try {
            console.log('🎵 Audio URL\'den oynatma başlatılıyor:', audioUrl);
            setMascotState('speaking');

            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio; // Track current audio

            audio.onloadstart = () => {
                console.log('🎵 Audio yüklenmeye başlad��');
            };

            audio.oncanplay = () => {
                console.log('�� Audio oynatılabilir durumda');
            };

            audio.onended = () => {
                console.log('🎵 Audio oynatma tamamlandı');
                setMascotState('listening');
            };

            audio.onerror = (error) => {
                console.error('❌ Audio URL oynatma hatası:', error);
                console.error('❌ Audio src:', audio.src);
                console.error('❌ Audio error details:', audio.error);
                setMascotState('listening');

                // Fallback to text-to-speech
                const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
                setImageAnalysisText(fallbackText);
        
            };

            await audio.play();
            console.log('🎵 Audio.play() çağrıldı');

        } catch (error) {
            console.error('❌ Audio URL işleme hatası:', error);
            setMascotState('listening');

            // Fallback to text-to-speech
            const fallbackText = 'Bu görselde çal��şkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
            setImageAnalysisText(fallbackText);
    
        }
    };

    // Play audio from API response
    const playAudioFromResponse = async (audioData) => {
        try {
            setMascotState('speaking');

            let audioUrl;

            // Check if audioData contains base64 data or URL
            if (audioData.data || audioData.base64) {
                // If base64 encoded audio
                const base64Data = audioData.data || audioData.base64;
                const audioBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'audio/mp3' });
                audioUrl = URL.createObjectURL(audioBlob);
            } else if (audioData.url || audioData.fileName) {
                // If URL provided
                audioUrl = audioData.url || audioData.fileName;
            } else {
                throw new Error('No audio data found in response');
            }

            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio; // Track current audio

            audio.onended = () => {
                setMascotState('listening');
                if (audioUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(audioUrl);
                }
            };

            audio.onerror = (error) => {
                console.error('Audio oynatma hatası:', error);
                setMascotState('listening');
                if (audioUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(audioUrl);
                }

                // Fallback to text-to-speech if audio fails
                const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
                setImageAnalysisText(fallbackText);
        
            };

            audio.play();
            console.log('🎵 Audio çalma başlatıldı');

        } catch (error) {
            console.error('Audio işleme hatası:', error);
            setMascotState('listening');

            // Fallback to text-to-speech
            const fallbackText = 'Bu görselde çalışkan karıncaları görüyoruz. Karıncalar birlikte çalışarak büyük işler başarırlar.';
            setImageAnalysisText(fallbackText);
    
        }
    };


    const handleReplay = () => {
        if (audioRef.current) {
            setMascotState('speaking');
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => {
                audioRef.current.addEventListener('ended', () => {
                    setMascotState('listening');
                }, { once: true });
            });
        }
    };

    // Play initial step audio (explanation)
    const playInitialStepAudio = async () => {
        try {
            const currentStepData = steps[currentStep];
            console.log(`🎵 Playing initial audio for step ${currentStep + 1}:`, currentStepData.audio);
            setMascotState('speaking');

            const audio = new Audio(currentStepData.audio);
            currentAudioRef.current = audio; // Track current audio

            audio.onended = () => {
                console.log(`🎵 Initial audio finished for step ${currentStep + 1}`);
                setInitialAudioFinished(true);
                // Don't start API here - it's already running in parallel
            };

            audio.onerror = (error) => {
                console.error(`❌ Initial audio error for step ${currentStep + 1}:`, error);
                setMascotState('listening');
                // Audio failed but API is already running in parallel
                setInitialAudioFinished(true);
            };

            await audio.play();

        } catch (error) {
            console.error(`❌ Initial audio playback error for step ${currentStep + 1}:`, error);
            setMascotState('listening');
            // Audio failed but API is already running in parallel
            setInitialAudioFinished(true);
        }
    };

    // Typewriter effect synchronized with audio duration
    const startTypewriterEffect = (audioDuration) => {
        if (!fullAnalysisText || (currentStep !== 0 && currentStep !== 1)) {
            console.log('❌ Typewriter blocked:', { fullAnalysisText: !!fullAnalysisText, currentStep });
            return;
        }

        console.log('🔤 Starting typewriter effect, audio duration:', audioDuration, 'text length:', fullAnalysisText.length);
        setIsTyping(true);
        setDisplayedText('');

        const totalChars = fullAnalysisText.length;
        const charDelay = Math.max((audioDuration * 1000) / totalChars, 50); // minimum 50ms delay

        console.log('🔤 Char delay:', charDelay, 'ms');

        let currentIndex = 0;

        typingIntervalRef.current = setInterval(() => {
            if (currentIndex <= totalChars) {
                const newText = fullAnalysisText.substring(0, currentIndex);
                setDisplayedText(newText);
                setImageAnalysisText(newText);
                currentIndex++;
            } else {
                // Typing complete
                clearInterval(typingIntervalRef.current);
                setIsTyping(false);
                setDisplayedText(fullAnalysisText);
                setImageAnalysisText(fullAnalysisText);
                setTypewriterFinished(true);
                console.log('✅ Typewriter completed');
            }
        }, charDelay);
    };

    // Voice response typewriter effect
    const startVoiceResponseTypewriter = (responseText, audioBase64) => {
        console.log('🔤 Starting voice response typewriter:', responseText.length, 'chars');
        setIsVoiceTyping(true);

        // If there's audio, start playing and sync typewriter
        if (audioBase64) {
            playVoiceResponseAudio(audioBase64, responseText);
        } else {
            // No audio, just type quickly
            typeVoiceResponse(responseText, 3000); // 3 seconds without audio
        }
    };

    // Play voice response audio and sync typewriter
    const playVoiceResponseAudio = async (audioBase64, responseText) => {
        try {
            console.log('🎵 Playing voice response audio with typewriter');
            setMascotState('speaking');

            // Convert base64 to blob
            const binaryString = atob(audioBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio; // Track current audio

            audio.onloadedmetadata = () => {
                console.log('🎵 Voice response audio duration:', audio.duration);
                typeVoiceResponse(responseText, (audio.duration || 5) * 1000);
            };

            audio.onended = () => {
                console.log('🎵 Voice response audio finished');
                setMascotState('listening');
                setIsVoiceTyping(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = (error) => {
                console.error('❌ Voice response audio error:', error);
                setMascotState('listening');
                setIsVoiceTyping(false);
                URL.revokeObjectURL(audioUrl);
                // Fallback to fast typing
                typeVoiceResponse(responseText, 3000);
            };

            await audio.play();

        } catch (error) {
            console.error('❌ Voice response audio playback error:', error);
            setMascotState('listening');
            typeVoiceResponse(responseText, 3000);
        }
    };

    // Type voice response text
    const typeVoiceResponse = (responseText, duration) => {
        const totalChars = responseText.length;
        const charDelay = Math.max(duration / totalChars, 30); // minimum 30ms

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= totalChars) {
                const newText = responseText.substring(0, currentIndex);
                setChildrenVoiceResponse(newText);
                currentIndex++;
            } else {
                clearInterval(interval);
                setIsVoiceTyping(false);
                setChildrenVoiceResponse(responseText);
            }
        }, charDelay);
    };

    // Play microphone prompt audio
    const playMicrophonePrompt = async () => {
        if (microphonePromptPlayed || (currentStep !== 0 && currentStep !== 1)) {
            console.log('🚫 Microphone prompt blocked:', { microphonePromptPlayed, currentStep });
            return;
        }

        // Extra protection: Set the flag immediately to prevent rapid calls
        setMicrophonePromptPlayed(true);

        try {
            console.log('🎤 Attempting to play microphone prompt audio');
            setMascotState('speaking');

            // Try multiple possible paths
            const possiblePaths = [
                '/audio/sira-sende-mikrofon.mp3',
                '/public/audio/sira-sende-mikrofon.mp3',
                '/src/assets/audios/sira-sende-mikrofon.mp3'
            ];

            let audio = null;
            let audioPlayed = false;

            for (const path of possiblePaths) {
                try {
                    console.log('🔍 Trying audio path:', path);
                    audio = new Audio(path);
                    microphonePromptAudioRef.current = audio; // Track microphone prompt audio

                    audio.onloadstart = () => {
                        console.log('✅ Audio loading started for:', path);
                    };

                    audio.oncanplay = () => {
                        console.log('✅ Audio can play:', path);
                    };

                    audio.onended = () => {
                        console.log('🎤 Microphone prompt finished');
                        setMascotState('listening');
                        microphonePromptAudioRef.current = null; // Clear ref when audio ends
                    };

                    audio.onerror = (error) => {
                        console.error('❌ Audio error for path', path, ':', error, audio.error);
                    };

                    await audio.play();
                    audioPlayed = true;
                    console.log('✅ Successfully playing audio from:', path);
                    break;

                } catch (err) {
                    console.warn('⚠️ Failed to play audio from', path, ':', err);
                    continue;
                }
            }

            if (!audioPlayed) {
                console.error('❌ All audio paths failed, falling back to silent mode');
                setMascotState('listening');
            }

        } catch (error) {
            console.error('❌ Microphone prompt playback error:', error);
            setMascotState('listening');
        }
    };

    // Recording functionality like ReadingScreen
    const handleRecord = async () => {
        try {
            // Check if MediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Bu tarayıcı ses kaydını desteklemiyor. Lütfen güncel bir tarayıcı kullanın.');
                return;
            }

            setIsRecording(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Tarayıcının desteklediği bir ses mime'ı seç
        const preferred = 'audio/webm;codecs=opus';
        const mimeType =
            (window.MediaRecorder && MediaRecorder.isTypeSupported(preferred))
            ? preferred
            : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');

        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks = [];
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const blobType = chunks[0]?.type || mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: blobType });

            // Kaydı otomatik gönder
            handleVoiceSubmit(blob);

            // Mikrofonu bırak
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();

        let time = 5;
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
        } catch (error) {
            console.error('❌ Mikrofon erişim hatası:', error);
            setIsRecording(false);

            if (error.name === 'NotAllowedError') {
                alert('Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından mikrofon erişimine izin verin.');
            } else if (error.name === 'NotFoundError') {
                alert('Mikrofon bulunamadı. Lütfen mikrofon ba��lı olduğundan emin olun.');
            } else {
                alert('Mikrofon erişiminde hata oluştu: ' + error.message);
            }
        }
    };

    // Ses dosyasını n8n'e gönder
    const handleVoiceSubmit = async (audioBlob) => {
    console.log('🎤 Çocuk sesi kaydı API\'ye gönderiliyor...');
    setIsProcessingVoice(true);

    try {
        const blobType = audioBlob.type || 'audio/webm';
        const ext =
        blobType.includes('mpeg') ? 'mp3' :
        blobType.includes('webm') ? 'webm' :
        blobType.includes('wav')  ? 'wav'  : 'dat';

        // Önemli: blobType ile uyumlu dosya uzantısı
        const file = new File([audioBlob], `cocuk_sesi.${ext}`, { type: blobType });

        const formData = new FormData();
        formData.append('ses', file); // Wait node'da Binary Property = "ses"
        formData.append('kullanici_id', '12345');
        formData.append('hikaye_adi', story.title);

        const stepNum = currentStep + 1;
        formData.append('adim', String(stepNum));
        formData.append('adim_tipi', stepNum === 1 ? 'gorsel_tahmini' : `step${stepNum}_cevap`);

        let voiceEndpoint = `${getApiBase()}/dost/level1/children-voice`;

        // Add resumeUrl if available
        if (resumeUrl) {
            formData.append("resumeUrl", resumeUrl);
            console.log('🔗 ResumeUrl eklendi:', resumeUrl);
            voiceEndpoint = resumeUrl;
        }

        // 🔑 Sabit URL yerine dinamik resumeUrl kullan
        //let resumeUrl = 'https://arge.aquateknoloji.com/webhook/dost/level1';
        //const voiceEndpoint = resumeUrl || 'https://arge.aquateknoloji.com/webhook/dost/level1/children-voice';

        console.log(`📤 ${stepNum}. adım dosyası yusa → ${voiceEndpoint}`);
        console.log('📄 FormData:', { ses: file.name, blobType, stepNum });

        // Tarayıcı boundary'yi kendisi ekler; headers gerekmez
        const { data } = await axios.post(voiceEndpoint, formData);

        console.log('✅ 2. API yanıtı (voice response):', data);
        console.log('🔍 Voice response keys:', Object.keys(data));

        // Extract text and audio from response
        const responseText = data.message || data.text || data.response || 'Çok güzel gözlemler! Karıncaları gerçekten iyi incelemişsin.';
        const responseAudioBase64 = data.audioBase64;

        console.log('📝 Response text:', responseText);
        console.log('🎵 Response audio available:', !!responseAudioBase64);

        // For steps 1 and 2, use typewriter for voice response too
        if (currentStep === 0 || currentStep === 1) {
            setVoiceResponseText(responseText);
            setChildrenVoiceResponse('');
            setIsVoiceTyping(true);
            startVoiceResponseTypewriter(responseText, responseAudioBase64);
        } else {
            setChildrenVoiceResponse(responseText);
        }

        // Play audio if available (like first API)
        if (responseAudioBase64) {
            console.log('🎵 Voice response audio bulundu, çalınıyor...');
            playAudioFromBase64(responseAudioBase64);
        } else {
            console.log('🔇 Voice response audio bulunamadı, sadece text gösteriliyor');
        }

        setStepCompleted(true);
        const newCompletedSteps = [...completedSteps];
        newCompletedSteps[currentStep] = true;
        setCompletedSteps(newCompletedSteps);
    } catch (error) {
        console.error('❌ Çocuk sesi API hatası:', error);
        const fallbackText = 'Çok güzel konuştun! (Çevrimdışı mod)';
        setChildrenVoiceResponse(fallbackText);
        console.log('🔇 Voice API hata - sadece fallback text, ses yok');

        // Mark step as completed even on error
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
            setResumeUrl(''); // Reset resumeUrl for new step
            setAudioPlaybackFinished(false); // Reset audio playback state
            setTypewriterFinished(false); // Reset typewriter state
            setDisplayedText('');
            setFullAnalysisText('');
            setIsTyping(false);
            setMicrophonePromptPlayed(false);
            setVoiceResponseText('');
            setIsVoiceTyping(false);
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
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
            setResumeUrl(''); // Reset resumeUrl for previous step
            setAudioPlaybackFinished(false); // Reset audio playback state
            setTypewriterFinished(false); // Reset typewriter state
            setDisplayedText('');
            setFullAnalysisText('');
            setIsTyping(false);
            setMicrophonePromptPlayed(false);
            setVoiceResponseText('');
            setIsVoiceTyping(false);
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        } else {
            navigate(`/story/1`);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9f9fb] flex flex-col relative top-[-24px]">
            <audio ref={audioRef} preload="auto" />

            {/* Progress Bar - Same as ReadingScreen */}
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

            {/* Step Counter - Same as ReadingScreen */}
            <div className="text-center py-2 bg-gray-50">
                <span className="text-sm text-gray-600">
                    Adım {currentStep + 1} / {steps.length}
                </span>
            </div>

            {/* Step Title - Show only after step starts */}
            {stepStarted && (
                <div className="bg-white border-b-2 border-purple-200 py-4 px-6">
                    <h1 className="text-2xl font-bold text-purple-800 text-center">
                        {steps[currentStep].title}
                    </h1>
                </div>
            )}

            {/* Completed Steps Checklist - Always visible */}
            <div className="bg-green-50 border-b border-green-200 py-3 px-6">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">Adım Durumu:</h3>
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

            {/* Step Start Screen */}
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

            {/* Main Content Screen - ReadingScreen Layout */}
            {stepStarted && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex-1 flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0"
                >
                    {/* Prev Button - Same position as ReadingScreen */}
                    <button
                        onClick={handlePrevStep}
                        className="absolute left-[-48px] top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded p-4 text-xl shadow-md z-10 hover:bg-green-300 transition-colors"
                        disabled={!allowFreeNav && (currentStep === 0 && stepStarted)}
                    >
                        ←
                    </button>

                    {/* Image Section - Left side - Bigger for step 1 */}
                    <div className="flex-shrink-0 mt-4">
                        <img
                            src={story.image}
                            alt={story.title}
                            className={`rounded-lg shadow-lg transition-all duration-300 ${
                                currentStep === 0
                                    ? 'w-80 md:w-96 lg:w-[420px]'
                                    : 'w-64 md:w-80'
                            }`}
                        />
                    </div>

                    {/* Content Section - Right side - Aligned with image */}
                    <div className={`text-lg text-gray-800 leading-relaxed ${
                        currentStep === 0
                            ? 'flex-1 max-w-2xl'
                            : 'max-w-xl'
                    }`}>
                        {/* Step 1: No description, only API response */}
                        {currentStep === 0 && (
                            <>
                                {/* Show step explanation initially, hide after API response */}
                                {!imageAnalysisText && (
                                    <p className="mt-4 text-gray-800">{steps[currentStep].text}</p>
                                )}
                            </>
                        )}

                        {/* Step 2: Show only title */}
                        {currentStep === 1 && (
                            <>
                                <h2 className="text-2xl font-bold text-purple-800 mb-4">{story.title}</h2>
                                {!imageAnalysisText && (
                                    <p className="mt-4 text-gray-800">{steps[currentStep].text}</p>
                                )}
                            </>
                        )}

                        {/* Step 3+: Show normal content */}
                        {currentStep > 1 && (
                            <>
                                <p className="mb-4 text-gray-700 font-medium">{story.description}</p>
                                {!imageAnalysisText && (
                                    <p className="mt-4 text-gray-800">{steps[currentStep].text}</p>
                                )}
                            </>
                        )}

                        {/* Image Analysis Result */}
                        {isAnalyzing && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <p className="text-blue-700 font-medium">DOST görseli analiz ediyor...</p>
                                </div>
                            </div>
                        )}

                        {(imageAnalysisText || ((currentStep === 0 || currentStep === 1) && isTyping)) && (
                            <div className={`mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300 ${
                                (currentStep === 0 || currentStep === 1) && isTyping ? 'min-h-[100px]' : ''
                            }`}>
                                <p className="text-blue-800 font-medium">🤖 DOST'un Analizi:</p>
                                <p className="text-blue-700" data-analysis-text>
                                    {(currentStep === 0 || currentStep === 1) ? displayedText : imageAnalysisText}
                                    {(currentStep === 0 || currentStep === 1) && isTyping && (
                                        <span className="animate-pulse text-blue-500">|</span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Step-specific prompt - Show only after audio playback is finished for steps 1 and 2 */}
                        {imageAnalysisText && !childrenVoiceResponse && !isProcessingVoice && (
                            (currentStep === 0 || currentStep === 1) ? audioPlaybackFinished : true
                        ) && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <p className="text-blue-800 font-medium">Görev:</p>
                                <p className="text-blue-700">{steps[currentStep].prompt}</p>
                            </div>
                        )}

                        {/* Voice Recording Response */}
                        {childrenVoiceResponse && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-700 font-medium">✅ Bu adımı tamamladın! Bir sonraki adıma geçebilirsin.</p>
                                <p className="text-green-700 mt-2">
                                    <strong>���️ DOST:</strong> {childrenVoiceResponse}
                                    {(currentStep === 0 || currentStep === 1) && isVoiceTyping && (
                                        <span className="animate-pulse text-green-500">|</span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Processing Voice */}
                        {isProcessingVoice && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                    <p className="text-yellow-700 font-medium">DOST senin sözlerini değerlendiriyor...</p>
                                </div>
                            </div>
                        )}

                        {/* Call to Action - Show only after audio playback is finished for steps 1 and 2 */}
                        {imageAnalysisText && !isRecording && !childrenVoiceResponse && !isProcessingVoice && (
                            (currentStep === 0 || currentStep === 1) ? (audioPlaybackFinished && typewriterFinished) : true
                        ) && (
                            <div className="mt-6 text-center">
                                <p className="mb-4 text-2xl font-bold text-green-700 animate-pulse">Hadi sıra sende!</p>
                                <p className="text-lg text-green-600">Mikrofona tıklayarak cevab��nı ver</p>
                            </div>
                        )}

                        {/* Big Microphone Button - Show only after audio playback is finished for steps 1 and 2 */}
                        {imageAnalysisText && !isRecording && !childrenVoiceResponse && !isProcessingVoice && (
                            (currentStep === 0 || currentStep === 1) ? (audioPlaybackFinished && typewriterFinished) : true
                        ) && (
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

                        {/* Circular Countdown Timer - ReadingScreen Style */}
                        {isRecording && (
                            <div className="mt-6 flex justify-center">
                                <div className="relative w-40 h-40">
                                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="transparent"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            fill="transparent"
                                            stroke="#ef4444"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 70}
                                            strokeDashoffset={2 * Math.PI * 70 * (countdown / 1)}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-5xl mb-2">🎙️</div>
                                        <div className="text-3xl font-bold text-red-600">{countdown}</div>
                                        <div className="text-sm font-medium text-gray-600">saniye</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Next Button - Same position as ReadingScreen */}
                    <button
                        onClick={handleNextStep}
                        className="absolute right-[-48px] top-1/2 transform -translate-y-1/2 bg-green-200 text-green-800 rounded p-4 text-xl shadow-md z-10 hover:bg-green-300 transition-colors disabled:opacity-50"
                        disabled={!allowFreeNav && (!stepCompleted && stepStarted)}
                    >
                        {currentStep === steps.length - 1 ? '🏠' : '→'}
                    </button>
                </motion.div>
            )}

            {/* Footer - ReadingScreen Style */}
            <div className="flex items-center justify-center gap-6 px-6 py-6 bg-gray-50">
                {/* Next Step Button */}
                {stepCompleted && currentStep < steps.length - 1 && (
                    <button
                        onClick={handleNextStep}
                        className="flex flex-col items-center bg-green-500 hover:bg-green-600 text-white rounded-2xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
                    >
                        <div className="text-4xl mb-2 text-blue-600">➡️</div>
                        <div className="text-lg font-bold">SONRAKİ ADIM</div>
                    </button>
                )}

                {/* Complete Button */}
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

            {/* Interactive DOST Maskot - ReadingScreen Style */}
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
        </div>
    );
}
