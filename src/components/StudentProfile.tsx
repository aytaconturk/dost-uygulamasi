import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgressStats, supabase } from '../lib/supabase';
import type { RootState } from '../store/store';

interface Reward {
  id: string;
  reward_type: string;
  reward_url: string;
  prompt_text: string;
  created_at: string;
}

export default function StudentProfile() {
  const student = useSelector((state: RootState) => state.user.student);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedStories, setCompletedStories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!student) {
      setTotalPoints(0);
      setCompletedStories(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const stats = await getStudentProgressStats(student.id);

      if (stats) {
        const totalPts = stats.stories.reduce(
          (sum: number, story: any) => sum + (story.points || 0),
          0
        );
        setTotalPoints(totalPts);
        setCompletedStories(stats.completed_stories);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  const loadRewards = useCallback(async () => {
    if (!student) return;
    
    try {
      setLoadingRewards(true);
      const { data, error } = await supabase
        .from('student_rewards')
        .select('id, reward_type, reward_url, prompt_text, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (err) {
      console.error('Error loading rewards:', err);
    } finally {
      setLoadingRewards(false);
    }
  }, [student?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (showGallery) {
      loadRewards();
    }
  }, [showGallery, loadRewards]);

  // Listen for progress update events
  useEffect(() => {
    const handleProgressUpdate = () => {
      loadStats();
    };
    
    window.addEventListener('progressUpdated', handleProgressUpdate);
    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate);
    };
  }, [loadStats]);

  // Listen for new reward events
  useEffect(() => {
    const handleNewReward = () => {
      if (showGallery) {
        loadRewards();
      }
    };
    
    window.addEventListener('rewardCreated', handleNewReward);
    return () => {
      window.removeEventListener('rewardCreated', handleNewReward);
    };
  }, [showGallery, loadRewards]);

  if (!student) return null;

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <>
      <div 
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-200 cursor-pointer"
        onClick={() => setShowGallery(true)}
        title="Ödüllerimi Göster"
      >
        <div className="hidden sm:block text-white text-sm font-medium truncate max-w-28">
          {student.first_name}
        </div>

        <div className="h-6 border-l border-white/30" />

        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <div className="flex flex-col leading-tight">
            <p className="text-xs text-white/80 font-medium">Puan</p>
            <p className="text-sm font-bold text-yellow-200">
              {loading ? '-' : totalPoints}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <div className="flex flex-col leading-tight">
            <p className="text-xs text-white/80 font-medium">Tamamlanan</p>
            <p className="text-sm font-bold text-purple-200">
              {loading ? '-' : completedStories}
            </p>
          </div>
        </div>

        {/* Ödül ikonu */}
        <div className="flex items-center gap-1 ml-1">
          <span className="text-lg">🎁</span>
          <span className="text-xs text-white/80 font-medium hidden md:block">Ödüllerim</span>
        </div>
      </div>

      {/* Ödül Galerisi Modal */}
      {showGallery && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div 
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Ödüllerim</h2>
                  <p className="text-white/60 text-sm">{student.first_name}'in kazandığı ödüller</p>
                </div>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="text-white/60 hover:text-white text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            {/* Gallery Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingRewards ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin text-4xl">🌀</div>
                  <span className="ml-3 text-white/60">Yükleniyor...</span>
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl block mb-4">🎨</span>
                  <p className="text-white/60 text-lg">Henüz ödül kazanmadın!</p>
                  <p className="text-white/40 text-sm mt-2">
                    Hikayeleri tamamlayıp ödül kazan 🌟
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {rewards.map((reward) => (
                    <div 
                      key={reward.id}
                      className="group relative bg-white/10 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setSelectedImage(reward.reward_url)}
                    >
                      <img
                        src={reward.reward_url}
                        alt={reward.prompt_text || 'Ödül'}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs line-clamp-2">
                            {reward.prompt_text || 'Görsel Ödül'}
                          </p>
                          <p className="text-white/50 text-[10px] mt-1">
                            {new Date(reward.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      {/* Rozet ikonu */}
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        🖼️
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {rewards.length > 0 && (
              <div className="p-4 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm">
                  Toplam {rewards.length} ödül 🎉
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tam Ekran Görsel Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={selectedImage}
              alt="Ödül"
              className="w-full rounded-2xl shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(selectedImage, `odul-${Date.now()}.png`);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors"
              >
                📥 İndir
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full backdrop-blur-sm transition-colors text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
