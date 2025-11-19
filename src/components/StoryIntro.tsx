import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgressByStory, initializeStudentProgress, logActivity } from '../lib/supabase';
import type { RootState } from '../store/store';

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

  useEffect(() => {
    loadProgress();
  }, [student, story]);

  if (!story) return <p>Hikaye bulunamadı</p>;

  const handleStart = async () => {
    if (!student) {
      setError('Lütfen giriş yapınız');
      return;
    }

    try {
      setLoading(true);
      await logActivity(student.id, 'story_started', {
        story_id: story.id,
        level_id: currentLevel,
      });

      navigate(`/level/${currentLevel}/step/1?storyId=${story.id}`);
    } catch (err) {
      setError('Hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white bg-opacity-90 rounded-xl p-6 shadow-xl">
      <img src={story.image} alt={story.title} className="w-full rounded-xl" />
      <div>
        <h2 className="text-3xl font-bold mb-4">{story.title}</h2>
        <div className="flex flex-wrap gap-2 text-sm mb-4">
          <span className="bg-purple-200 text-purple-700 px-3 py-1 rounded-full">
            Seviye {currentLevel}
          </span>
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
  );
}
