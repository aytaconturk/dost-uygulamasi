import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgressStats } from '../lib/supabase';
import type { RootState } from '../store/store';

export default function StudentProfile() {
  const student = useSelector((state: RootState) => state.user.student);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedStories, setCompletedStories] = useState(0);
  const [loading, setLoading] = useState(true);

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
  }, [student?.id]); // Only depend on student.id

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  if (!student) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-200">
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
    </div>
  );
}
