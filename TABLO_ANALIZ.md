# Supabase Tablo Analizi ve Karşılaştırma

## 📊 Kodda Kullanılan Tablolar (18 adet)

1. ✅ **stories** - Hikaye verileri
2. ✅ **story_paragraphs** - Hikaye paragrafları
3. ✅ **users** - Kullanıcılar (auth)
4. ✅ **teachers** - Öğretmenler
5. ✅ **students** - Öğrenciler
6. ✅ **student_progress** - Öğrenci ilerlemesi (her hikaye için 1 kayıt)
7. ✅ **activity_logs** - Aktivite logları
8. ✅ **levels** - Seviye tanımları
9. ✅ **level_steps** - Adım tanımları
10. ✅ **reading_logs** - Okuma logları (WPM, doğru kelime sayısı)
11. ✅ **reading_goals** - Okuma hedefleri
12. ✅ **sessions** - Oturum takibi
13. ✅ **step_completions** - Adım tamamlanma durumları
14. ✅ **api_logs** - API request/response logları
15. ✅ **audio_recordings** - Ses kayıtları metadata
16. ✅ **scores** - Puanlar (quiz, okuma hızı, vs.)
17. ✅ **points_history** - Puan geçmişi (detaylı log)
18. ✅ **student_actions** - Öğrenci hareketleri (her aksiyon için 1 kayıt)

## 📋 Supabase'deki Mevcut Tablolar (Görsellerden - 19 adet)

1. ✅ activity_logs
2. ✅ api_logs
3. ✅ audio_recordings
4. ✅ level_steps
5. ✅ levels
6. ✅ points_history
7. ✅ reading_goals
8. ✅ reading_logs
9. ❌ **reading_progress** - GEREKSİZ (kodda kullanılmıyor)
10. ✅ scores
11. ✅ sessions
12. ✅ step_completions
13. ✅ stories
14. ✅ story_paragraphs
15. ✅ student_actions
16. ✅ student_progress
17. ✅ students
18. ✅ teachers
19. ✅ users

## 🔍 Fark Analizi

### Eksik Tablolar
**YOK** - Tüm gerekli tablolar mevcut ✅

### Fazla/Gereksiz Tablolar
1. ❌ **reading_progress** - Kodda kullanılmıyor, `student_progress` kullanılıyor

## 📝 student_actions vs student_progress Farkı

### student_progress (Öğrenci İlerlemesi)
- **Amaç**: Öğrencinin bir hikayedeki genel durumunu tutar
- **Yapı**: Her öğrenci + hikaye kombinasyonu için **1 kayıt**
- **İçerik**:
  - `current_level` - Şu anki seviye (1-5)
  - `current_step` - Şu anki adım
  - `completed_levels` - Tamamlanan seviyeler array'i
  - `points` - Toplam puan
  - `is_completed` - Hikaye tamamlandı mı?
  - `started_at`, `completed_at` - Başlangıç/bitiş zamanları
- **Kullanım**: Dashboard'da seviye gösterimi, puan hesaplama, ilerleme takibi
- **Örnek**: Öğrenci A, Hikaye 1 → 1 kayıt (current_level: 3, points: 250)

### student_actions (Öğrenci Hareketleri)
- **Amaç**: Öğrencinin yaptığı her aksiyonu loglar
- **Yapı**: Her aksiyon için **1 kayıt** (çok fazla veri olabilir)
- **İçerik**:
  - `action_type` - Aksiyon tipi ('session_started', 'step_completed', 'button_clicked', 'level_completed', 'story_completed', 'step_navigation')
  - `action_data` - Aksiyona özel JSON verileri
  - `story_id`, `level`, `step` - Hangi hikaye/seviye/adım
  - `timestamp` - Ne zaman yapıldı
- **Kullanım**: Detaylı analiz, debug, kullanıcı davranış analizi
- **Örnek**: Öğrenci A, Hikaye 1 → 56 kayıt (her buton tıklaması, adım geçişi, vs.)

### Özet
- **student_progress**: Genel durum (1 kayıt/hikaye) - Dashboard için
- **student_actions**: Detaylı log (çok kayıt) - Analiz için

## ✅ Sonuç

**Toplam Olması Gereken Tablo Sayısı**: 18
**Supabase'deki Tablo Sayısı**: 19 (1 gereksiz: reading_progress)

**Öneri**: `reading_progress` tablosunu silebilirsiniz, kodda kullanılmıyor.




