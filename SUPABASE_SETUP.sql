-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Progress table (tracks level completion per student per story)
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  current_level INTEGER DEFAULT 1,
  completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, story_id)
);

-- Reading Logs table (detailed logs of each reading session)
CREATE TABLE reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  wpm INTEGER NOT NULL,
  correct_words INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_reading_progress_student_id ON reading_progress(student_id);
CREATE INDEX idx_reading_logs_student_id ON reading_logs(student_id);
CREATE INDEX idx_reading_logs_timestamp ON reading_logs(timestamp);
