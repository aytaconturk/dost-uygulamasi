export type UserRole = 'teacher' | 'admin' | 'user';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Teacher = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  school_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  user_id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
};

export type Level = {
  id: number;
  level_number: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type LevelStep = {
  id: number;
  level_id: number;
  step_number: number;
  title: string;
  description: string | null;
  audio_file_url: string | null;
  content: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentProgress = {
  id: string;
  student_id: string;
  story_id: number;
  current_level: number;
  current_step: number;
  completed_levels: number[];
  is_completed: boolean;
  points: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  student_id: string;
  story_id: number | null;
  level_id: number | null;
  step_number: number | null;
  activity_type: 'level_started' | 'level_completed' | 'step_completed' | 'error_logged' | 'voice_response' | 'story_started' | 'story_completed';
  data: Record<string, any> | null;
  error_message: string | null;
  voice_response_file_url: string | null;
  api_response: Record<string, any> | null;
  timestamp: string;
};

export type ReadingProgress = {
  id: string;
  student_id: string;
  story_id: number;
  current_level: number;
  current_step: number;
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
