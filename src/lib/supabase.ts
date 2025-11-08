import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Supabase] Initializing with URL:', supabaseUrl ? 'configured' : 'NOT CONFIGURED');
console.log('[Supabase] Initializing with Anon Key:', supabaseAnonKey ? 'configured' : 'NOT CONFIGURED');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not configured - app will not work!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Client initialized');

export type Teacher = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Student = {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

export type ReadingProgress = {
  id: string;
  student_id: string;
  story_id: number;
  current_level: number;
  completed_levels: number[];
  created_at: string;
  updated_at: string;
};

export type ReadingLog = {
  id: string;
  student_id: string;
  story_id: number;
  level: number;
  wpm: number;
  correct_words: number;
  total_words: number;
  timestamp: string;
};

export async function getTeacherStudents(teacherId: string) {
  return supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId);
}

export async function getStudentProgress(studentId: string) {
  return supabase
    .from('reading_progress')
    .select('*')
    .eq('student_id', studentId);
}

export async function getStudentProgressByStory(studentId: string, storyId: number) {
  return supabase
    .from('reading_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .single();
}

export async function upsertProgressLevel(
  studentId: string,
  storyId: number,
  level: number
) {
  const { data: existing } = await getStudentProgressByStory(studentId, storyId);
  
  if (existing) {
    const completedLevels = Array.isArray(existing.completed_levels)
      ? existing.completed_levels
      : [];
    
    if (!completedLevels.includes(level)) {
      completedLevels.push(level);
    }

    return supabase
      .from('reading_progress')
      .update({
        current_level: Math.max(existing.current_level, level),
        completed_levels: completedLevels,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    return supabase
      .from('reading_progress')
      .insert({
        student_id: studentId,
        story_id: storyId,
        current_level: level,
        completed_levels: [level],
        updated_at: new Date().toISOString(),
      });
  }
}

export async function insertReadingLog(
  studentId: string,
  storyId: number,
  level: number,
  wpm: number,
  correctWords: number,
  totalWords: number
) {
  return supabase
    .from('reading_logs')
    .insert({
      student_id: studentId,
      story_id: storyId,
      level,
      wpm,
      correct_words: correctWords,
      total_words: totalWords,
      timestamp: new Date().toISOString(),
    });
}

export async function insertReadingGoal(
  studentId: string,
  storyId: number,
  level: number,
  selectedWpm: number,
  increasePercentage: number,
  baseWpm: number,
  teacherId?: string
) {
  return supabase
    .from('reading_goals')
    .insert({
      student_id: studentId,
      teacher_id: teacherId || null,
      story_id: storyId,
      level,
      selected_wpm: selectedWpm,
      increase_percentage: increasePercentage,
      base_wpm: baseWpm,
      timestamp: new Date().toISOString(),
    });
}
