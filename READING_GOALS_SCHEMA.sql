-- Create reading_goals table for storing student reading goals
CREATE TABLE IF NOT EXISTS public.reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  selected_wpm INTEGER NOT NULL,
  increase_percentage INTEGER NOT NULL,
  base_wpm INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS reading_goals_student_id_idx ON public.reading_goals(student_id);
CREATE INDEX IF NOT EXISTS reading_goals_teacher_id_idx ON public.reading_goals(teacher_id);
CREATE INDEX IF NOT EXISTS reading_goals_story_id_idx ON public.reading_goals(story_id);
CREATE INDEX IF NOT EXISTS reading_goals_level_idx ON public.reading_goals(level);
CREATE INDEX IF NOT EXISTS reading_goals_timestamp_idx ON public.reading_goals(timestamp);
CREATE INDEX IF NOT EXISTS reading_goals_student_story_idx ON public.reading_goals(student_id, story_id);

-- Enable Row Level Security
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own reading goals
CREATE POLICY "Students can view own reading goals" ON public.reading_goals
  FOR SELECT
  USING (auth.uid()::text = student_id::text);

-- RLS Policy: Teachers can view their students' reading goals
CREATE POLICY "Teachers can view student reading goals" ON public.reading_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = reading_goals.student_id
      AND students.teacher_id = auth.uid()::uuid
    )
  );

-- RLS Policy: Students can insert their own reading goals
CREATE POLICY "Students can insert reading goals" ON public.reading_goals
  FOR INSERT
  WITH CHECK (auth.uid()::text = student_id::text);

-- RLS Policy: System can insert reading goals (for app inserts)
CREATE POLICY "System can insert reading goals" ON public.reading_goals
  FOR INSERT
  WITH CHECK (true);

-- Add table comment
COMMENT ON TABLE public.reading_goals IS 'Stores reading speed improvement goals set by students. Used for tracking and logging progress towards target WPM (words per minute).';

-- Add column comments
COMMENT ON COLUMN public.reading_goals.student_id IS 'Reference to the student who set this goal';
COMMENT ON COLUMN public.reading_goals.teacher_id IS 'Optional reference to the teacher who assigned or monitors this goal';
COMMENT ON COLUMN public.reading_goals.story_id IS 'The story/book being read (references the story ID)';
COMMENT ON COLUMN public.reading_goals.level IS 'The level in the reading program (e.g., 2 for Level 2)';
COMMENT ON COLUMN public.reading_goals.selected_wpm IS 'The target words per minute the student selected';
COMMENT ON COLUMN public.reading_goals.increase_percentage IS 'The percentage increase chosen (5, 7, or 10)';
COMMENT ON COLUMN public.reading_goals.base_wpm IS 'The baseline reading speed before improvement goal';
COMMENT ON COLUMN public.reading_goals.timestamp IS 'When the goal was created/selected';
