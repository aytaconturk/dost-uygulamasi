import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getStudentProgress, type ReadingProgress } from '../lib/supabase';
import type { RootState } from '../store/store';

export function useReadingProgress() {
  const student = useSelector((state: RootState) => state.user.student);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!student) {
      setLoading(false);
      setProgress([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
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
  }, [student?.id]); // Only depend on student.id, not the whole student object

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Listen for progress update events
  useEffect(() => {
    const handleProgressUpdate = () => {
      fetchProgress();
    };
    
    window.addEventListener('progressUpdated', handleProgressUpdate);
    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate);
    };
  }, [fetchProgress]);

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
    refresh: fetchProgress,
  };
}
