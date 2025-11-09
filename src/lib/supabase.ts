import { createClient } from '@supabase/supabase-js';
import type { ActivityLog } from './supabase-types';

export type {
  UserRole,
  User,
  Teacher,
  Student,
  Level,
  LevelStep,
  StudentProgress,
  ActivityLog,
  ReadingProgress,
  ReadingLog,
} from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not configured!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== STORIES =====

export async function getStories() {
  return supabase
    .from('stories')
    .select('*')
    .order('id', { ascending: true });
}

export async function createStory(
  id: number,
  title: string,
  description: string,
  image: string,
  locked?: boolean
) {
  return supabase
    .from('stories')
    .insert({
      id,
      title,
      description,
      image,
      locked: locked || false,
    })
    .select()
    .single();
}

export async function updateStory(
  id: number,
  updates: {
    title?: string;
    description?: string;
    image?: string;
    locked?: boolean;
  }
) {
  return supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteStory(id: number) {
  return supabase
    .from('stories')
    .delete()
    .eq('id', id);
}

// ===== USER MANAGEMENT =====

export async function createUserAndTeacher(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  schoolName?: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError, data: null };
  }

  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    role: 'teacher',
  });

  if (userError) {
    return { error: userError, data: null };
  }

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .insert({
      user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      school_name: schoolName,
    })
    .select()
    .single();

  return { error: teacherError, data: teacher };
}

export async function createStudentForTeacher(
  teacherId: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError, data: null };
  }

  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    role: 'user',
  });

  if (userError) {
    return { error: userError, data: null };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      user_id: authData.user.id,
      teacher_id: teacherId,
      first_name: firstName,
      last_name: lastName,
    })
    .select()
    .single();

  return { error: studentError, data: student };
}

export async function getUserByEmail(email: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
}

export async function getTeacherByUserId(userId: string) {
  return supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .single();
}

export async function getStudentByUserId(userId: string) {
  return supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .single();
}

// ===== TEACHER QUERIES =====

export async function getTeacherStudents(teacherId: string) {
  return supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId);
}

export async function getStudentsByTeacherId(teacherId: string) {
  return supabase
    .from('students')
    .select('id, first_name, last_name, user_id, created_at')
    .eq('teacher_id', teacherId);
}

// ===== STUDENT PROGRESS =====

export async function initializeStudentProgress(
  studentId: string,
  storyId: number
) {
  return supabase
    .from('student_progress')
    .insert({
      student_id: studentId,
      story_id: storyId,
      current_level: 1,
      current_step: 1,
      completed_levels: [],
      is_completed: false,
    })
    .select()
    .single();
}

export async function getStudentProgress(studentId: string) {
  return supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId);
}

export async function getStudentProgressByStory(
  studentId: string,
  storyId: number
) {
  return supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .single();
}

export async function updateStudentProgress(
  studentId: string,
  storyId: number,
  currentLevel: number,
  currentStep: number,
  completedLevel?: number
) {
  const { data: existing } = await getStudentProgressByStory(
    studentId,
    storyId
  );

  if (!existing) {
    return await initializeStudentProgress(studentId, storyId);
  }

  const completedLevels = Array.isArray(existing.completed_levels)
    ? existing.completed_levels
    : [];

  if (completedLevel && !completedLevels.includes(completedLevel)) {
    completedLevels.push(completedLevel);
  }

  return supabase
    .from('student_progress')
    .update({
      current_level: currentLevel,
      current_step: currentStep,
      completed_levels: completedLevels,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();
}

export async function completeStory(studentId: string, storyId: number) {
  return supabase
    .from('student_progress')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .select()
    .single();
}

export async function awardPoints(
  studentId: string,
  storyId: number,
  pointsToAdd: number,
  reason?: string
) {
  const { data: progress } = await getStudentProgressByStory(studentId, storyId);

  if (!progress) {
    return { error: new Error('Progress not found'), data: null };
  }

  const newPoints = (progress.points || 0) + pointsToAdd;

  const updateResult = await supabase
    .from('student_progress')
    .update({
      points: newPoints,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id)
    .select()
    .single();

  if (!updateResult.error) {
    await supabase.from('points_history').insert({
      student_id: studentId,
      story_id: storyId,
      level_number: progress.current_level,
      points_earned: pointsToAdd,
      reason: reason || 'Level tamamlandı',
    });
  }

  return updateResult;
}

// ===== ACTIVITY LOGGING =====

export async function logActivity(
  studentId: string,
  activityType: ActivityLog['activity_type'],
  data?: {
    story_id?: number;
    level_id?: number;
    step_number?: number;
    error_message?: string;
    voice_response_file_url?: string;
    api_response?: Record<string, any>;
    additional_data?: Record<string, any>;
  }
) {
  return supabase.from('activity_logs').insert({
    student_id: studentId,
    story_id: data?.story_id || null,
    level_id: data?.level_id || null,
    step_number: data?.step_number || null,
    activity_type: activityType,
    error_message: data?.error_message || null,
    voice_response_file_url: data?.voice_response_file_url || null,
    api_response: data?.api_response || null,
    data: data?.additional_data || null,
  });
}

export async function getStudentActivityLogs(
  studentId: string,
  limit?: number
) {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('timestamp', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

// ===== LEVELS & STEPS =====

export async function getLevels() {
  return supabase
    .from('levels')
    .select('*')
    .order('level_number', { ascending: true });
}

export async function getLevelSteps(levelId: number) {
  return supabase
    .from('level_steps')
    .select('*')
    .eq('level_id', levelId)
    .order('step_number', { ascending: true });
}

export async function getLevelWithSteps(levelNumber: number) {
  const { data: level } = await supabase
    .from('levels')
    .select('*')
    .eq('level_number', levelNumber)
    .single();

  if (!level) {
    return { level: null, steps: null };
  }

  const { data: steps } = await getLevelSteps(level.id);

  return { level, steps };
}

// ===== ADMIN QUERIES =====

export async function getAllTeachers() {
  return supabase
    .from('teachers')
    .select('*, users(email)')
    .order('created_at', { ascending: false });
}

export async function getAllStudents() {
  return supabase
    .from('students')
    .select('*, users(email), teachers(first_name, last_name)')
    .order('created_at', { ascending: false });
}

export async function getStudentProgressStats(studentId: string) {
  const { data } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId);

  if (!data) return null;

  const completed = data.filter((p) => p.is_completed).length;
  const total = data.length;

  return {
    total_stories: total,
    completed_stories: completed,
    progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    stories: data,
  };
}

export async function updateStudentProgressStep(
  studentId: string,
  storyId: number,
  currentLevel: number,
  currentStep: number
) {
  try {
    const { data: existing, error: fetchError } = await getStudentProgressByStory(
      studentId,
      storyId
    );

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError);
    }

    if (!existing) {
      console.log('Creating new progress record for student:', studentId, 'story:', storyId);
      return await initializeStudentProgress(studentId, storyId);
    }

    console.log('Updating progress for student:', studentId, 'story:', storyId);
    return supabase
      .from('student_progress')
      .update({
        current_level: currentLevel,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
  } catch (err) {
    console.error('Error in updateStudentProgressStep:', err);
    return { error: err, data: null };
  }
}

// ===== LEGACY FUNCTIONS =====

export async function upsertProgressLevel(
  studentId: string,
  storyId: number,
  level: number
) {
  return updateStudentProgress(studentId, storyId, level, 1, level);
}

export async function insertReadingLog(
  studentId: string,
  storyId: number,
  level: number,
  wpm: number,
  correctWords: number,
  totalWords: number
) {
  return supabase.from('reading_logs').insert({
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
  return supabase.from('reading_goals').insert({
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
