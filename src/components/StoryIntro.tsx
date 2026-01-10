import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgressByStory, initializeStudentProgress, logActivity } from '../lib/supabase';
import type { RootState } from '../store/store';
import StrategyIntroVideo from './StrategyIntroVideo';
import { getAppMode } from '../lib/api';
import { getStoryImageUrl } from '../lib/image-utils';

interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface Props {
  stories: Story[];
}

export default function StoryIntro({ stories }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const student = useSelector((state: RootState) => state.user.student);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStrategyVideo, setShowStrategyVideo] = useState(false);

  const story = stories.find((s) => s.id === Number(id));

  const loadProgress = async () => {
    if (!student || !story) return;

    try {
      const { data: progress, error: queryError } = await getStudentProgressByStory(
        student.id,
        story.id
      );

      if (queryError && queryError.code !== 'PGRST116') {
        console.warn('Progress query error:', queryError);
      }

      if (progress) {
        console.log('Loaded progress:', progress);
        setCurrentLevel(progress.current_level || 1);
      } else {
        const { error: initError } = await initializeStudentProgress(student.id, story.id);
        if (initError) {
          console.error('Initialize progress error:', initError);
        }
        setCurrentLevel(1);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const handleStrategyVideoComplete = () => {
    localStorage.setItem('dost_strategy_video_seen', 'true');
    setShowStrategyVideo(false);
  };

  const handleStrategyVideoSkip = () => {
    // Only allow skip if not mandatory (story id > 3)
    if (story && story.id > 3) {
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
      await logActivity(student.id, 'story_started', {
        story_id: story!.id,
        level_id: currentLevel,
      });

      // Navigate to level intro screen instead of directly to step 1
      navigate(`/level/${currentLevel}/intro?storyId=${story!.id}`);
    } catch (err) {
      setError('Hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    
    // Check if strategy video should be shown
    // Only show in prod mode, only for level 1, and only for first 3 stories or if not seen before
    if (story) {
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
      
      // Only show video if current level is 1
      // First 3 stories (id: 1, 2, 3) require strategy video
      // After that, check if user has seen it before
      const shouldShowVideo = currentLevel === 1 && (story.id <= 3 || !hasSeenStrategyVideo);
      setShowStrategyVideo(shouldShowVideo);
    }
  }, [student, story, currentLevel]);

  if (!story) return <p>Hikaye bulunamadı</p>;

  return (
    <>
      {/* Strategy Video Popup - Only shown if conditions are met */}
      {showStrategyVideo && story && (
        <StrategyIntroVideo
          storyId={story.id}
          onComplete={handleStrategyVideoComplete}
          onSkip={handleStrategyVideoSkip}
        />
      )}
      
      {/* Main Story Intro Content */}
      <div className="max-w-5xl mx-auto mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white bg-opacity-90 rounded-xl p-6 shadow-xl">
      <img src={getStoryImageUrl(story.image || `/images/story${story.id}.png`)} alt={story.title} className="w-full rounded-xl" />
      <div>
        <h2 className="text-3xl font-bold mb-4">{story.title}</h2>
        <div className="flex flex-wrap gap-2 text-sm mb-4">
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Düzeyli Okuma</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Yazar: DOST AI • Yayın: Yapay Zeka Kitaplığı</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-green-500 cursor-pointer disabled:bg-green-300 text-white py-2 px-6 rounded-full shadow hover:bg-green-600 transition-colors"
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
          <button
            onClick={loadProgress}
            className="text-sm underline text-blue-500 hover:text-blue-700"
            title="Seviyeyi yeniden yükle"
          >
            🔄 Yenile
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
