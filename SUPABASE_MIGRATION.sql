-- ============================================
-- DOST Uygulaması - Kapsamlı Supabase Migration
-- ============================================
-- Bu migration dosyası tüm yeni tabloları ve özellikleri içerir:
-- 1. Oturum takibi (sessions)
-- 2. API logları (api_logs)
-- 3. Öğrenci hareketleri (student_actions)
-- 4. Puanlar (scores)
-- 5. Ses kayıtları metadata (audio_recordings)
-- 6. Adım tamamlanma durumları (step_completions)
-- ============================================

-- ===== 0. CREATE/UPDATE STUDENT_PROGRESS TABLE FIRST =====
-- student_progress tablosunu oluştur veya güncelle (ÖNCE BU ÇALIŞMALI!)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  current_level INTEGER DEFAULT 1,
  current_step INTEGER DEFAULT 1,
  completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  points INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, story_id)
);

-- Eksik kolonları ekle (eğer tablo zaten varsa)
DO $$ 
BEGIN
  -- current_step kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN current_step INTEGER DEFAULT 1;
  END IF;

  -- points kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'points'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN points INTEGER DEFAULT 0;
  END IF;

  -- is_completed kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN is_completed BOOLEAN DEFAULT false;
  END IF;

  -- completed_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- started_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- completed_levels kolonu yoksa ekle (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'completed_levels'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[];
  END IF;

  -- current_level kolonu yoksa ekle (eğer hiç yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'current_level'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN current_level INTEGER DEFAULT 1;
  END IF;

  -- updated_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- created_at kolonu yoksa ekle (ÖNEMLİ - Bu hata bu yüzden oluşuyor!)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Index'leri oluştur
CREATE INDEX IF NOT EXISTS student_progress_student_id_idx ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS student_progress_story_id_idx ON public.student_progress(story_id);
CREATE INDEX IF NOT EXISTS student_progress_current_level_idx ON public.student_progress(current_level);
CREATE INDEX IF NOT EXISTS student_progress_is_completed_idx ON public.student_progress(is_completed);

-- ===== 1. SESSIONS TABLE (Oturum Takibi) =====
-- ÖNEMLİ: students tablosunun var olduğundan emin olun!
-- Eğer students tablosu yoksa, önce onu oluşturun.
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  story_id INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER, -- Toplam süre (saniye)
  is_active BOOLEAN DEFAULT true,
  completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Tamamlanan seviyeler
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key'i ayrı olarak ekle (eğer students tablosu varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    -- Foreign key constraint'i ekle (eğer yoksa)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'sessions_student_id_fkey' 
      AND table_name = 'sessions'
    ) THEN
      ALTER TABLE public.sessions 
      ADD CONSTRAINT sessions_student_id_fkey 
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sessions_student_id_idx ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS sessions_story_id_idx ON public.sessions(story_id);
CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON public.sessions(started_at);
CREATE INDEX IF NOT EXISTS sessions_is_active_idx ON public.sessions(is_active);

-- ===== 2. API_LOGS TABLE (API Request/Response Logları) =====
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  step INTEGER NOT NULL,
  api_endpoint TEXT NOT NULL, -- API endpoint URL
  request_method TEXT NOT NULL, -- GET, POST, etc.
  request_body JSONB, -- Request body (ses kayıtları, metinler, vs.)
  request_headers JSONB, -- Request headers
  response_status INTEGER, -- HTTP status code
  response_body JSONB, -- Response body (tam API response)
  response_time_ms INTEGER, -- Response süresi (milisaniye)
  error_message TEXT, -- Hata mesajı varsa
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_logs_student_id_idx ON public.api_logs(student_id);
CREATE INDEX IF NOT EXISTS api_logs_session_id_idx ON public.api_logs(session_id);
CREATE INDEX IF NOT EXISTS api_logs_story_id_idx ON public.api_logs(story_id);
CREATE INDEX IF NOT EXISTS api_logs_level_step_idx ON public.api_logs(level, step);
CREATE INDEX IF NOT EXISTS api_logs_timestamp_idx ON public.api_logs(timestamp);

-- ===== 3. AUDIO_RECORDINGS TABLE (Ses Kayıtları Metadata) =====
CREATE TABLE IF NOT EXISTS public.audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  step INTEGER NOT NULL,
  recording_type TEXT NOT NULL, -- 'student_voice', 'api_response', etc.
  file_path TEXT, -- Supabase Storage path (eğer storage'a kaydedilirse)
  file_size_bytes INTEGER, -- Dosya boyutu
  duration_seconds REAL, -- Kayıt süresi (saniye)
  mime_type TEXT, -- audio/webm, audio/mp3, etc.
  base64_data TEXT, -- Base64 encoded data (küçük dosyalar için)
  metadata JSONB, -- Ek metadata (paragraph_no, word_count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audio_recordings_student_id_idx ON public.audio_recordings(student_id);
CREATE INDEX IF NOT EXISTS audio_recordings_session_id_idx ON public.audio_recordings(session_id);
CREATE INDEX IF NOT EXISTS audio_recordings_story_level_step_idx ON public.audio_recordings(story_id, level, step);

-- ===== 4. STEP_COMPLETIONS TABLE (Adım Tamamlanma Durumları) =====
CREATE TABLE IF NOT EXISTS public.step_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  step INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completion_data JSONB, -- Adıma özel tamamlanma verileri (puanlar, cevaplar, vs.)
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER, -- Bu adım için geçen süre
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, story_id, level, step, session_id) -- Aynı oturumda aynı adım tekrar tamamlanamaz
);

CREATE INDEX IF NOT EXISTS step_completions_student_id_idx ON public.step_completions(student_id);
CREATE INDEX IF NOT EXISTS step_completions_session_id_idx ON public.step_completions(session_id);
CREATE INDEX IF NOT EXISTS step_completions_story_level_step_idx ON public.step_completions(story_id, level, step);
CREATE INDEX IF NOT EXISTS step_completions_is_completed_idx ON public.step_completions(is_completed);

-- ===== 5. SCORES TABLE (Puanlar) =====
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  step INTEGER,
  score_type TEXT NOT NULL, -- 'quiz', 'reading_speed', 'comprehension', 'completion', etc.
  points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER, -- Maksimum puan
  score_data JSONB, -- Puanla ilgili ek veriler (doğru/yanlış sayıları, vs.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scores_student_id_idx ON public.scores(student_id);
CREATE INDEX IF NOT EXISTS scores_session_id_idx ON public.scores(session_id);
CREATE INDEX IF NOT EXISTS scores_story_id_idx ON public.scores(story_id);
CREATE INDEX IF NOT EXISTS scores_level_idx ON public.scores(level);

-- ===== 5B. POINTS_HISTORY TABLE (Puan Geçmişi) =====
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id BIGINT NOT NULL,
  level_number INTEGER NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  reason TEXT, -- Puan kazanma nedeni (örn: "Seviye 1 tamamlandı")
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- NOT created_at, it's earned_at!
);

-- Index'leri oluştur (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_points_history_student ON public.points_history(student_id);
CREATE INDEX IF NOT EXISTS points_history_story_id_idx ON public.points_history(story_id);
CREATE INDEX IF NOT EXISTS points_history_level_number_idx ON public.points_history(level_number);
CREATE INDEX IF NOT EXISTS idx_points_history_earned_at ON public.points_history(earned_at DESC);

-- ===== 6. STUDENT_ACTIONS TABLE (Öğrenci Hareketleri) =====
CREATE TABLE IF NOT EXISTS public.student_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  story_id INTEGER,
  level INTEGER,
  step INTEGER,
  action_type TEXT NOT NULL, -- 'step_started', 'step_completed', 'button_clicked', 'audio_played', etc.
  action_data JSONB, -- Action'a özel veriler
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_actions_student_id_idx ON public.student_actions(student_id);
CREATE INDEX IF NOT EXISTS student_actions_session_id_idx ON public.student_actions(session_id);
CREATE INDEX IF NOT EXISTS student_actions_action_type_idx ON public.student_actions(action_type);
CREATE INDEX IF NOT EXISTS student_actions_timestamp_idx ON public.student_actions(timestamp);

-- ===== 7. UPDATE EXISTING STUDENT_PROGRESS TABLE =====
-- Mevcut student_progress tablosuna session_id ekleyelim (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS student_progress_session_id_idx ON public.student_progress(session_id);
  END IF;
END $$;

-- ===== 8. UPDATE EXISTING READING_LOGS TABLE =====
-- Mevcut reading_logs tablosuna session_id ekleyelim
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reading_logs' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.reading_logs 
    ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS reading_logs_session_id_idx ON public.reading_logs(session_id);
  END IF;
END $$;

-- ===== 9. FUNCTIONS =====

-- Oturum süresini güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.total_duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sessions tablosu için trigger
DROP TRIGGER IF EXISTS trigger_update_session_duration ON public.sessions;
CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- ===== 10. COMMENTS =====
COMMENT ON TABLE public.sessions IS 'Öğrenci oturumları - bir hikayeye başladığında başlar, tüm seviyeler tamamlandığında biter';
COMMENT ON TABLE public.api_logs IS 'Tüm API request/response logları - ses kayıtları, analizler, vs.';
COMMENT ON TABLE public.audio_recordings IS 'Ses kayıtları metadata - öğrenci sesleri ve API response sesleri';
COMMENT ON TABLE public.step_completions IS 'Her adımın tamamlanma durumu - next butonu kontrolü için kullanılır';
COMMENT ON TABLE public.scores IS 'Tüm puanlar - quiz, okuma hızı, anlama, vs.';
COMMENT ON TABLE public.points_history IS 'Öğrencilerin kazandığı puanların detaylı geçmişi - her seviye tamamlandığında kaydedilir';
COMMENT ON TABLE public.student_actions IS 'Öğrenci hareketleri - buton tıklamaları, adım geçişleri, vs.';

