-- ============================================
-- DOST Uygulaması - RLS (Row Level Security) Politikaları
-- ============================================
-- Bu dosya student_progress tablosu için RLS politikalarını içerir.
-- Eğer RLS sorunları yaşıyorsanız, bu dosyayı Supabase SQL Editor'de çalıştırın.
-- ============================================

-- ÖNEMLİ: Eğer RLS sorunları yaşıyorsanız ve development ortamındaysanız,
-- RLS'yi geçici olarak devre dışı bırakabilirsiniz:
-- ALTER TABLE public.student_progress DISABLE ROW LEVEL SECURITY;

-- ===== STUDENT_PROGRESS TABLE RLS POLICIES =====

-- RLS'yi etkinleştir (eğer zaten etkin değilse)
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (eğer varsa)
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.student_progress;
DROP POLICY IF EXISTS "Allow all operations" ON public.student_progress;

-- Politika 1: Öğrenciler kendi progress'lerini görebilir
-- NOT: Bu politika auth.uid() kullanıyor, eğer authentication kullanmıyorsanız
-- aşağıdaki "Allow all operations" politikasını kullanın
CREATE POLICY "Students can view own progress" ON public.student_progress
  FOR SELECT
  USING (
    -- Eğer authentication kullanıyorsanız:
    -- auth.uid()::text = student_id::text
    -- Eğer authentication kullanmıyorsanız, tüm kayıtları göster:
    true
  );

-- Politika 2: Öğrenciler kendi progress'lerini güncelleyebilir
CREATE POLICY "Students can update own progress" ON public.student_progress
  FOR UPDATE
  USING (
    -- Eğer authentication kullanıyorsanız:
    -- auth.uid()::text = student_id::text
    -- Eğer authentication kullanmıyorsanız, tüm kayıtları güncelleyebilir:
    true
  )
  WITH CHECK (
    -- Eğer authentication kullanıyorsanız:
    -- auth.uid()::text = student_id::text
    -- Eğer authentication kullanmıyorsanız, tüm kayıtları güncelleyebilir:
    true
  );

-- Politika 3: Öğrenciler kendi progress'lerini ekleyebilir
CREATE POLICY "Students can insert own progress" ON public.student_progress
  FOR INSERT
  WITH CHECK (
    -- Eğer authentication kullanıyorsanız:
    -- auth.uid()::text = student_id::text
    -- Eğer authentication kullanmıyorsanız, tüm kayıtları ekleyebilir:
    true
  );

-- ALTERNATIF: Eğer authentication kullanmıyorsanız ve tüm işlemlere izin vermek istiyorsanız:
-- Bu politikaları kullanın (yukarıdakileri yorum satırı yapın):

-- CREATE POLICY "Allow all operations" ON public.student_progress
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- ===== POINTS_HISTORY TABLE RLS POLICIES =====

-- Eğer points_history tablosu için de RLS sorunları varsa:
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on points_history" ON public.points_history;

CREATE POLICY "Allow all operations on points_history" ON public.points_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===== NOTLAR =====
-- 1. Bu politikalar development ortamı için tasarlanmıştır.
-- 2. Production ortamında authentication kullanıyorsanız, 
--    `auth.uid()::text = student_id::text` kontrollerini aktif edin.
-- 3. Eğer hala sorun yaşıyorsanız, RLS'yi geçici olarak devre dışı bırakabilirsiniz:
--    ALTER TABLE public.student_progress DISABLE ROW LEVEL SECURITY;






