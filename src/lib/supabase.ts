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
  TextSegment,
  StoryParagraph,
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

export async function getStoryById(storyId: number) {
  return supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
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

// ===== STORY PARAGRAPHS =====

export async function getStoryParagraphs(storyId: number) {
  return supabase
    .from('story_paragraphs')
    .select('*')
    .eq('story_id', storyId)
    .order('paragraph_index', { ascending: true });
}

export async function insertStoryParagraphs(
  storyId: number,
  paragraphs: Array<{ paragraph_index: number; text_segments: any[] }>
) {
  const data = paragraphs.map(p => ({
    story_id: storyId,
    paragraph_index: p.paragraph_index,
    text_segments: p.text_segments,
  }));

  return supabase
    .from('story_paragraphs')
    .insert(data);
}

export async function deleteStoryParagraphs(storyId: number) {
  return supabase
    .from('story_paragraphs')
    .delete()
    .eq('story_id', storyId);
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
  // Fetch latest data to get most recent points (with retry to ensure we get latest)
  let existing;
  let fetchError;
  
  // Retry fetching to ensure we get the latest data (in case awardPoints just updated)
  for (let i = 0; i < 3; i++) {
    const result = await getStudentProgressByStory(studentId, storyId);
    existing = result.data;
    fetchError = result.error;
    
    if (existing || (fetchError && fetchError.code === 'PGRST116')) {
      break;
    }
    
    // Wait a bit before retry
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching progress:', fetchError);
  }

  if (!existing) {
    return await initializeStudentProgress(studentId, storyId);
  }

  const completedLevels = Array.isArray(existing.completed_levels)
    ? existing.completed_levels
    : [];

  if (completedLevel && !completedLevels.includes(completedLevel)) {
    completedLevels.push(completedLevel);
  }

  console.log('Updating progress:', {
    studentId,
    storyId,
    currentLevel,
    currentStep,
    completedLevel,
    existingPoints: existing.points || 0,
    completedLevels
  });

  // Update progress (preserve existing points to avoid overwriting)
  // Note: We don't use .select() here because RLS might block RETURNING clause
  const updateResult = await supabase
    .from('student_progress')
    .update({
      current_level: currentLevel,
      current_step: currentStep,
      completed_levels: completedLevels,
      points: existing.points || 0, // Preserve existing points
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateResult.error) {
    console.error('❌ Failed to update progress:', updateResult.error);
    return { error: updateResult.error, data: null };
  }

  console.log('✅ Progress update executed (checking result...)');

  // Wait a bit to ensure database consistency, then fetch updated data
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fetch updated data separately to avoid RLS issues
  const { data: updatedData, error: fetchError2 } = await getStudentProgressByStory(studentId, storyId);
  
  if (fetchError2) {
    console.error('⚠️ Failed to fetch updated progress:', fetchError2);
    // Return success anyway since update succeeded, with merged data
    return { 
      error: null, 
      data: { 
        ...existing, 
        current_level: currentLevel, 
        current_step: currentStep,
        completed_levels: completedLevels,
        points: existing.points || 0
      } 
    };
  }

  console.log('✅ Progress updated successfully:', updatedData);
  return { error: null, data: updatedData };
}

export async function completeStory(studentId: string, storyId: number) {
  // Update without .single() to avoid RLS issues
  const updateResult = await supabase
    .from('student_progress')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('story_id', storyId);

  if (updateResult.error) {
    return { error: updateResult.error, data: null };
  }

  // Fetch updated data separately
  const { data: updatedData } = await getStudentProgressByStory(studentId, storyId);
  return { error: null, data: updatedData };
}

export async function awardPoints(
  studentId: string,
  storyId: number,
  pointsToAdd: number,
  reason?: string
) {
  let { data: progress, error: progressError } = await getStudentProgressByStory(studentId, storyId);

  // If progress doesn't exist, initialize it
  if (!progress && progressError?.code === 'PGRST116') {
    console.log('Progress not found, initializing...');
    const initResult = await initializeStudentProgress(studentId, storyId);
    if (initResult.error) {
      return { error: initResult.error, data: null };
    }
    progress = initResult.data;
  }

  if (!progress) {
    return { error: new Error('Progress not found and could not be initialized'), data: null };
  }

  const newPoints = (progress.points || 0) + pointsToAdd;

  console.log('Awarding points:', { 
    studentId, 
    storyId, 
    currentPoints: progress.points || 0, 
    pointsToAdd, 
    newPoints 
  });

  // Update points (without .select() to avoid RLS issues with UPDATE ... RETURNING)
  const updateResult = await supabase
    .from('student_progress')
    .update({
      points: newPoints,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id);

  if (updateResult.error) {
    console.error('❌ Failed to update points:', updateResult.error);
    return { error: updateResult.error, data: null };
  }

  console.log('✅ Points update executed (checking result...)');

  // Insert into points_history
  try {
    await supabase.from('points_history').insert({
      student_id: studentId,
      story_id: storyId,
      level_number: progress.current_level || 1,
      points_earned: pointsToAdd,
      reason: reason || 'Level tamamlandı',
    });
    console.log('✅ Points history recorded');
  } catch (historyError) {
    console.error('⚠️ Failed to record points history:', historyError);
    // Don't fail the whole operation if history insert fails
  }

  // Fetch updated data separately to avoid RLS issues with .single()
  const { data: updatedData, error: fetchError } = await getStudentProgressByStory(studentId, storyId);
  
  if (fetchError) {
    console.error('⚠️ Failed to fetch updated progress:', fetchError);
    // Return success anyway since update succeeded
    return { error: null, data: { ...progress, points: newPoints } };
  }

  console.log('✅ Points updated successfully:', updatedData);
  return { error: null, data: updatedData };
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
  currentStep: number,
  completedLevel?: number
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

    // If completedLevel is provided, use updateStudentProgress to handle completed_levels
    if (completedLevel !== undefined) {
      return await updateStudentProgress(studentId, storyId, currentLevel, currentStep, completedLevel);
    }

    console.log('Updating progress for student:', studentId, 'story:', storyId);
    
    // Update progress (without .single() to avoid RLS issues)
    const updateResult = await supabase
      .from('student_progress')
      .update({
        current_level: currentLevel,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateResult.error) {
      console.error('❌ Failed to update progress:', updateResult.error);
      return { error: updateResult.error, data: null };
    }

    // Fetch updated data separately to avoid RLS issues with .single()
    const { data: updatedData, error: fetchError2 } = await getStudentProgressByStory(studentId, storyId);
    
    if (fetchError2) {
      console.error('⚠️ Failed to fetch updated progress:', fetchError2);
      // Return success anyway since update succeeded
      return { error: null, data: { ...existing, current_level: currentLevel, current_step: currentStep } };
    }

    console.log('✅ Progress updated successfully:', updatedData);
    return { error: null, data: updatedData };
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

// ===== SESSION MANAGEMENT =====

export async function createSession(
  studentId: string,
  storyId: number
) {
  return supabase
    .from('sessions')
    .insert({
      student_id: studentId,
      story_id: storyId,
      started_at: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();
}

export async function endSession(sessionId: string) {
  return supabase
    .from('sessions')
    .update({
      ended_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', sessionId)
    .select()
    .single();
}

export async function getActiveSession(studentId: string, storyId: number) {
  return supabase
    .from('sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
}

export async function updateSessionCompletedLevels(
  sessionId: string,
  completedLevels: number[]
) {
  return supabase
    .from('sessions')
    .update({
      completed_levels: completedLevels,
    })
    .eq('id', sessionId);
}

// ===== STEP COMPLETIONS =====

export async function markStepCompleted(
  sessionId: string | null,
  studentId: string,
  storyId: number,
  level: number,
  step: number,
  completionData?: any
) {
  return supabase
    .from('step_completions')
    .upsert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId,
      level,
      step,
      is_completed: true,
      completion_data: completionData || {},
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'student_id,story_id,level,step,session_id',
    })
    .select()
    .single();
}

export async function markStepStarted(
  sessionId: string | null,
  studentId: string,
  storyId: number,
  level: number,
  step: number
) {
  return supabase
    .from('step_completions')
    .upsert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId,
      level,
      step,
      is_completed: false,
      started_at: new Date().toISOString(),
    }, {
      onConflict: 'student_id,story_id,level,step,session_id',
    })
    .select()
    .single();
}

export async function isStepCompleted(
  studentId: string,
  storyId: number,
  level: number,
  step: number,
  sessionId?: string | null
): Promise<boolean> {
  let query = supabase
    .from('step_completions')
    .select('is_completed')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .eq('level', level)
    .eq('step', step);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query.single();

  if (error || !data) return false;
  return data.is_completed === true;
}

// ===== API LOGS =====

export async function logApiCall(
  sessionId: string | null,
  studentId: string,
  storyId: number,
  level: number,
  step: number,
  apiEndpoint: string,
  requestMethod: string,
  requestBody?: any,
  requestHeaders?: any,
  responseStatus?: number,
  responseBody?: any,
  responseTimeMs?: number,
  errorMessage?: string
) {
  return supabase
    .from('api_logs')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId,
      level,
      step,
      api_endpoint: apiEndpoint,
      request_method: requestMethod,
      request_body: requestBody || null,
      request_headers: requestHeaders || null,
      response_status: responseStatus || null,
      response_body: responseBody || null,
      response_time_ms: responseTimeMs || null,
      error_message: errorMessage || null,
      timestamp: new Date().toISOString(),
    });
}

// ===== AUDIO RECORDINGS =====

export async function saveAudioRecording(
  sessionId: string | null,
  studentId: string,
  storyId: number,
  level: number,
  step: number,
  recordingType: 'student_voice' | 'api_response',
  filePath?: string,
  fileSizeBytes?: number,
  durationSeconds?: number,
  mimeType?: string,
  base64Data?: string,
  metadata?: any
) {
  return supabase
    .from('audio_recordings')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId,
      level,
      step,
      recording_type: recordingType,
      file_path: filePath || null,
      file_size_bytes: fileSizeBytes || null,
      duration_seconds: durationSeconds || null,
      mime_type: mimeType || null,
      base64_data: base64Data || null,
      metadata: metadata || {},
    });
}

// ===== SCORES =====

export async function saveScore(
  sessionId: string | null,
  studentId: string,
  storyId: number,
  level: number,
  step: number | null,
  scoreType: string,
  points: number,
  maxPoints?: number,
  scoreData?: any
) {
  return supabase
    .from('scores')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId,
      level,
      step: step || null,
      score_type: scoreType,
      points,
      max_points: maxPoints || null,
      score_data: scoreData || {},
    });
}

// ===== STUDENT ACTIONS =====

export async function logStudentAction(
  sessionId: string | null,
  studentId: string,
  actionType: string,
  storyId?: number,
  level?: number,
  step?: number,
  actionData?: any
) {
  return supabase
    .from('student_actions')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      story_id: storyId || null,
      level: level || null,
      step: step || null,
      action_type: actionType,
      action_data: actionData || {},
      timestamp: new Date().toISOString(),
    });
}

// ===== READING GOALS HELPERS =====

export async function getLatestReadingGoal(
  studentId: string,
  storyId: number,
  level: number
) {
  const { data, error } = await supabase
    .from('reading_goals')
    .select('*')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .eq('level', level)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.selected_wpm;
}

// ===== COMPREHENSION QUESTIONS =====

export interface ComprehensionQuestion {
  id: string;
  story_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  question_order: number;
  question_audio_url: string | null;
  correct_answer_audio_url: string | null;
  wrong_answer_audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getComprehensionQuestionsByStory(storyId: number) {
  return supabase
    .from('comprehension_questions')
    .select('*')
    .eq('story_id', storyId)
    .order('question_order', { ascending: true });
}

export async function createComprehensionQuestion(
  storyId: number,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctOption: 'A' | 'B' | 'C' | 'D',
  questionOrder: number,
  questionAudioUrl?: string | null,
  correctAnswerAudioUrl?: string | null,
  wrongAnswerAudioUrl?: string | null
) {
  return supabase
    .from('comprehension_questions')
    .insert({
      story_id: storyId,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      question_order: questionOrder,
      question_audio_url: questionAudioUrl || null,
      correct_answer_audio_url: correctAnswerAudioUrl || null,
      wrong_answer_audio_url: wrongAnswerAudioUrl || null,
    });
}

export async function updateComprehensionQuestion(
  questionId: string,
  updates: Partial<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
    question_order: number;
    question_audio_url: string | null;
    correct_answer_audio_url: string | null;
    wrong_answer_audio_url: string | null;
  }>
) {
  return supabase
    .from('comprehension_questions')
    .update(updates)
    .eq('id', questionId);
}

export async function deleteComprehensionQuestion(questionId: string) {
  return supabase
    .from('comprehension_questions')
    .delete()
    .eq('id', questionId);
}

// ===== STEP COMPLETION DATA HELPERS =====

export async function getStepCompletionData(
  studentId: string,
  storyId: number,
  level: number,
  step: number,
  sessionId?: string | null
) {
  let query = supabase
    .from('step_completions')
    .select('completion_data')
    .eq('student_id', studentId)
    .eq('story_id', storyId)
    .eq('level', level)
    .eq('step', step)
    .eq('is_completed', true);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query.order('completed_at', { ascending: false }).limit(1).single();

  if (error || !data) return null;
  return data.completion_data;
}
