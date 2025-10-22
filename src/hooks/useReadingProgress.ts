import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgress, type ReadingProgress } from '../lib/supabase';
import type { RootState } from '../store/store';

export function useReadingProgress() {
  const student = useSelector((state: RootState) => state.user.student);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const { data, error: queryError } = await getStudentProgress(student.id);
        if (queryError) throw queryError;
        setProgress(data || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Progress yüklenemedi';
        setError(message);
        console.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [student]);

  const getStoryProgress = (storyId: number): ReadingProgress | undefined => {
    return progress.find(p => p.story_id === storyId);
  };

  const getCurrentLevel = (storyId: number): number => {
    return getStoryProgress(storyId)?.current_level ?? 1;
  };

  const isStoryCompleted = (storyId: number): boolean => {
    const prog = getStoryProgress(storyId);
    return prog ? prog.completed_levels.includes(5) : false;
  };

  return {
    progress,
    loading,
    error,
    getStoryProgress,
    getCurrentLevel,
    isStoryCompleted,
  };
}
