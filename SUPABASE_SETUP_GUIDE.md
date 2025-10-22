# Supabase Setup Kılavuzu

## 1. Supabase Tabloları Oluşturma

Supabase dashboard'ında şu adımları izle:

1. [app.supabase.com](https://app.supabase.com) adresine git
2. Projenizi seçin
3. Sol menüde **SQL Editor** seçeneğine tıkla
4. **New Query** butonu ile yeni bir sorgu oluştur
5. Aşağıdaki SQL kodunu kopyala ve yapıştır:

```sql
-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Progress table
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

-- Reading Logs table
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

-- Create indexes
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_reading_progress_student_id ON reading_progress(student_id);
CREATE INDEX idx_reading_logs_student_id ON reading_logs(student_id);
CREATE INDEX idx_reading_logs_timestamp ON reading_logs(timestamp);
```

6. **Run** butonuna tıkla
7. Başarı mesajı beklemeyi hatırla

## 2. Row Level Security (RLS) Ayarları

Opsiyonel olarak, verileri daha güvenli hale getirmek için RLS kuralları ekleyebilirsin.

## 3. Environment Variables

Şu değerler zaten ayarlanmış:
- `VITE_SUPABASE_URL`: https://uitwmrclbpvhrcrotlcs.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (kopyalandı)

## 4. Test Etme

1. Uygulamayı başlat: `npm run dev`
2. Öğretmen girişi yap (yeni hesap oluştur)
3. Öğrenci ekle
4. Öğrencini seç ve sistemi kullan

## 5. Sorun Giderme

### "Tables not found" hatası
- SQL sorgularının başarıyla çalıştığını kontrol et
- Supabase dashboard'ında **Table Editor** açıp tabloları görüyor musun?

### "Permission denied" hatası
- RLS ayarlarını kontrol et
- Development için RLS'yi devre dışı bırakabilirsin (⚠️ Production için uygun değil)

## 6. İleri Adımlar (İsteğe bağlı)

### Row Level Security Etkinleştir
Öğretmenlerin sadece kendi öğrencilerini görmesi için:

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can view their own students"
  ON students FOR SELECT
  USING (auth.uid() = teacher_id);
```

Bunun için Supabase Authentication'ı da kurman gerekir.
