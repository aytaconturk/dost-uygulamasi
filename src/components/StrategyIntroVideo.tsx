import { useState, useRef, useEffect } from 'react';

interface Props {
  storyId: number;
  onComplete: () => void;
  onSkip?: () => void;
}

export default function StrategyIntroVideo({ storyId, onComplete, onSkip }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if this is one of the first 3 sessions (mandatory)
  // 4. hikayeden sonra "Tanıtımı Geç" butonuyla kapatılabilir
  const isMandatory = storyId <= 3;
  const canSkip = !isMandatory;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setIsLoading(false);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onComplete();
    };
    const handleLoadedData = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setIsLoading(false);
      }
    };
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setVideoError('Video yüklenirken bir hata oluştu.');
      setIsLoading(false);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Try to load the video
    video.load();

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      setVideoError('Video oynatılamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      onSkip?.();
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Prevent closing on outside click if mandatory
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMandatory && e.target === e.currentTarget) {
      // Don't close if mandatory
      return;
    }
    if (canSkip && e.target === e.currentTarget) {
      handleSkip();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* Header - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">DOST</h1>
          <h2 className="text-lg font-semibold text-gray-200">
            Strateji Tanıtımı ve Güzel Okuma Kuralları
          </h2>
          {isMandatory && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Bu oturum için strateji tanıtımı zorunludur. Video bitene kadar kapanmaz.
            </p>
          )}
        </div>
        {canSkip && (
          <button
            onClick={handleSkip}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm ml-4"
          >
            Tanıtımı Geç
          </button>
        )}
      </div>

      {/* Video Container - Full screen */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-24">
        <div className="relative w-full h-full flex items-center justify-center">
          {videoError ? (
            <div className="flex items-center justify-center h-full text-white p-4">
              <div className="text-center">
                <p className="text-red-400 mb-2">{videoError}</p>
                <button
                  onClick={() => {
                    setVideoError(null);
                    setIsLoading(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src="/videos/dost-okuma-stratejisi.mp4"
                controls={false}
                preload="metadata"
                playsInline
              >
                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center">
                    <p className="mb-2">Video yükleniyor...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Custom Controls Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <button
                onClick={handlePlayPause}
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-6 shadow-lg transition-all hover:scale-110"
              >
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 bg-opacity-50">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <button
            onClick={handlePlayPause}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isPlaying ? '⏸ Duraklat' : '▶ Oynat'}
          </button>
          <span className="text-white text-lg font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        {isMandatory && (
          <div className="text-center">
            <p className="text-xs text-gray-300">
              Video bittiğinde otomatik olarak devam edeceksiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

