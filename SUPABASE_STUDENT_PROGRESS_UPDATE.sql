-- ============================================
-- STUDENT_PROGRESS Tablosu Güncelleme
-- Puan ve Seviye Geçişleri İçin Gerekli Kolonlar
-- ============================================

-- Mevcut student_progress tablosuna eksik kolonları ekle
DO $$ 
BEGIN
  -- current_step kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN current_step INTEGER DEFAULT 1;
    RAISE NOTICE 'current_step kolonu eklendi';
  END IF;

  -- points kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'points'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN points INTEGER DEFAULT 0;
    RAISE NOTICE 'points kolonu eklendi';
  END IF;

  -- is_completed kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN is_completed BOOLEAN DEFAULT false;
    RAISE NOTICE 'is_completed kolonu eklendi';
  END IF;

  -- completed_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'completed_at kolonu eklendi';
  END IF;

  -- started_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'started_at kolonu eklendi';
  END IF;

  -- completed_levels kolonu yoksa ekle (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'completed_levels'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[];
    RAISE NOTICE 'completed_levels kolonu eklendi';
  END IF;

  -- session_id kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS student_progress_session_id_idx ON public.student_progress(session_id);
    RAISE NOTICE 'session_id kolonu eklendi';
  END IF;

  -- current_level kolonu yoksa ekle (eğer hiç yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'current_level'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN current_level INTEGER DEFAULT 1;
    RAISE NOTICE 'current_level kolonu eklendi';
  END IF;

  -- updated_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'updated_at kolonu eklendi';
  END IF;

  -- created_at kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.student_progress 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'created_at kolonu eklendi';
  END IF;

END $$;

-- Index'leri oluştur (eğer yoksa)
CREATE INDEX IF NOT EXISTS student_progress_student_id_idx ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS student_progress_story_id_idx ON public.student_progress(story_id);
CREATE INDEX IF NOT EXISTS student_progress_current_level_idx ON public.student_progress(current_level);
CREATE INDEX IF NOT EXISTS student_progress_is_completed_idx ON public.student_progress(is_completed);

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_student_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_progress_updated_at ON public.student_progress;
CREATE TRIGGER trigger_update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_student_progress_updated_at();

-- Tablo yorumu
COMMENT ON TABLE public.student_progress IS 'Öğrenci ilerlemesi - her öğrenci + hikaye kombinasyonu için 1 kayıt. Puan, seviye ve adım bilgilerini tutar.';

COMMENT ON COLUMN public.student_progress.current_level IS 'Öğrencinin şu anki seviyesi (1-5)';
COMMENT ON COLUMN public.student_progress.current_step IS 'Öğrencinin şu anki adımı';
COMMENT ON COLUMN public.student_progress.completed_levels IS 'Tamamlanan seviyeler array''i [1, 2, 3] gibi';
COMMENT ON COLUMN public.student_progress.points IS 'Öğrencinin bu hikayede kazandığı toplam puan';
COMMENT ON COLUMN public.student_progress.is_completed IS 'Hikaye tamamlandı mı? (tüm 5 seviye tamamlandığında true)';

