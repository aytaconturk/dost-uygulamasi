import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getStoryById, logActivity } from '../lib/supabase';
import type { RootState } from '../store/store';
import StrategyIntroVideo from './StrategyIntroVideo';
import { getAppMode } from '../lib/api';
import { getStoryImageUrl } from '../lib/image-utils';

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Metnin görselini, başlığını ve içeriğini inceleyerek okuma öncesi hazırlık yapacağız.',
  2: 'Metni ilk kez okuyup okuma hızını belirleyeceğiz ve okuma hedefi oluşturacağız.',
  3: 'Model okuma yapıp metni tekrar okuyacağız ve okuma hızını geliştireceğiz.',
  4: 'Şema üzerinden beyin fırtınası yapıp özet çıkaracağız ve okuduğunu anlama sorularını cevaplayacağız.',
  5: 'Okuduğunu anlama sorularını cevaplayıp hedefe bağlı ödül alacağız ve çalışmayı sonlandıracağız.',
};

const LEVEL_TITLES: Record<number, string> = {
  1: '1. Seviye: Okuma Öncesi Hazırlık',
  2: '2. Seviye: İlk Okuma ve Hız Belirleme',
  3: '3. Seviye: Model Okuma ve Hız Geliştirme',
  4: '4. Seviye: Şema ve Özetleme',
  5: '5. Seviye: Okuduğunu Anlama ve Sonlandırma',
};

export default function LevelIntro() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [showStrategyVideo, setShowStrategyVideo] = useState(false);

  const levelNumber = Number(level) || 1;
  const storyId = Number(searchParams.get('storyId')) || 1;

  // Fetch story title
  useEffect(() => {
    const fetchStoryTitle = async () => {
      try {
        const { data, error } = await getStoryById(storyId);
        if (!error && data) {
          setStoryTitle(data.title);
        } else {
          // Fallback
          const FALLBACK_STORIES: Record<number, string> = {
            1: 'Kırıntıların Kahramanları',
            2: 'Avucumun İçindeki Akıllı Kutu',
            3: 'Hurma Ağacı',
            4: 'Akdeniz Bölgesi',
            5: 'Çöl Gemisi',
          };
          setStoryTitle(FALLBACK_STORIES[storyId] || `Oturum ${storyId}`);
        }
      } catch (err) {
        console.error('Error fetching story title:', err);
        setStoryTitle(`Oturum ${storyId}`);
      }
    };

    if (storyId) {
      fetchStoryTitle();
    }
  }, [storyId]);

  const handleStrategyVideoComplete = () => {
    localStorage.setItem('dost_strategy_video_seen', 'true');
    setShowStrategyVideo(false);
  };

  const handleStrategyVideoSkip = () => {
    // Only allow skip if not mandatory (story id > 3)
    if (storyId > 3) {
      localStorage.setItem('dost_strategy_video_seen', 'true');
      setShowStrategyVideo(false);
    }
  };

  const handleStart = async () => {
    if (!student) {
      setError('Lütfen giriş yapınız');
      return;
    }

    try {
      setLoading(true);
      await logActivity(student.id, 'level_started', {
        story_id: storyId,
        level_id: levelNumber,
      });

      navigate(`/level/${levelNumber}/step/1?storyId=${storyId}`);
    } catch (err) {
      setError('Hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if strategy video should be shown (only for level 1, first 3 stories)
  useEffect(() => {
    if (levelNumber === 1) {
      const appMode = getAppMode();
      const hasSeenStrategyVideo = localStorage.getItem('dost_strategy_video_seen') === 'true';
      
      // Check for skip intro flag (URL param or localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      const skipIntroParam = urlParams.get('skipIntro') === '1';
      const skipIntroStorage = localStorage.getItem('dost_skip_intro') === 'true';
      
      // If skipIntro=1 in URL, save to localStorage for future visits
      if (skipIntroParam) {
        localStorage.setItem('dost_skip_intro', 'true');
      }
      
      // Don't show video in dev mode or if skip flag is set
      if (appMode === 'dev' || skipIntroParam || skipIntroStorage) {
        setShowStrategyVideo(false);
        return;
      }
      
      // First 3 stories (id: 1, 2, 3) require strategy video
      // After that, check if user has seen it before
      const shouldShowVideo = storyId <= 3 || !hasSeenStrategyVideo;
      setShowStrategyVideo(shouldShowVideo);
    } else {
      setShowStrategyVideo(false);
    }
  }, [levelNumber, storyId]);

  const levelDescription = LEVEL_DESCRIPTIONS[levelNumber] || 'Bu seviyeyi tamamlayarak okuma becerilerini geliştireceksin.';
  const levelTitle = LEVEL_TITLES[levelNumber] || `Seviye ${levelNumber}`;

  // Get story image using helper function (works both locally and in production)
  const storyImage = getStoryImageUrl(`/images/story${storyId}.png`);

  return (
    <>
      {/* Strategy Video Popup - Only shown if conditions are met */}
      {showStrategyVideo && levelNumber === 1 && (
        <StrategyIntroVideo
          storyId={storyId}
          currentLevel={levelNumber}
          onComplete={handleStrategyVideoComplete}
          onSkip={handleStrategyVideoSkip}
        />
      )}
      
      <div className="max-w-5xl mx-auto mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white bg-opacity-90 rounded-xl p-6 shadow-xl">
      <img 
        src={storyImage} 
        alt={storyTitle} 
        className="w-full rounded-xl" 
        onError={(e) => {
          // Fallback image if story image fails
          (e.target as HTMLImageElement).src = getStoryImageUrl('/images/story1.png');
        }}
      />
      <div>
        <h2 className="text-3xl font-bold mb-2">{storyTitle}</h2>
        <h3 className="text-2xl font-semibold text-purple-800 mb-4">{levelTitle}</h3>
        <div className="flex flex-wrap gap-2 text-sm mb-4">
          <span className="bg-purple-200 text-purple-700 px-3 py-1 rounded-full">
            Seviye {levelNumber}
          </span>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Düzeyli Okuma</span>
        </div>
        <p className="text-base text-gray-700 mb-4">{levelDescription}</p>
        <p className="text-sm text-gray-600 mb-4">Yazar: DOST AI • Yayın: Yapay Zeka Kitaplığı</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-green-500 cursor-pointer disabled:bg-green-300 text-white py-2 px-6 rounded-full shadow hover:bg-green-600 transition-colors font-bold text-lg"
        >
          {loading ? 'Yükleniyor...' : 'Başla'}
        </button>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm underline text-gray-500 hover:text-gray-700"
          >
            ← Geri dön
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

