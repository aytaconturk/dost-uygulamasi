# Supabase Güncelleme Rehberi

## 🎯 Yapılacaklar

### 1. ✅ Yeni Tabloları Oluştur (SUPABASE_MIGRATION.sql)
Eğer daha önce çalıştırmadıysanız, `SUPABASE_MIGRATION.sql` dosyasını çalıştırın:
- `sessions` - Oturum takibi
- `api_logs` - API logları
- `audio_recordings` - Ses kayıtları
- `step_completions` - Adım tamamlanma
- `scores` - Puanlar
- `points_history` - Puan geçmişi
- `student_actions` - Öğrenci hareketleri

### 2. 🔧 student_progress Tablosunu Güncelle (SUPABASE_STUDENT_PROGRESS_UPDATE.sql)
**BU DOSYAYI MUTLAKA ÇALIŞTIRIN!** 

Bu dosya `student_progress` tablosuna eksik kolonları ekler:
- ✅ `current_step` - Şu anki adım (1, 2, 3, ...)
- ✅ `points` - Toplam puan
- ✅ `is_completed` - Hikaye tamamlandı mı?
- ✅ `completed_at` - Tamamlanma zamanı
- ✅ `started_at` - Başlangıç zamanı
- ✅ `completed_levels` - Tamamlanan seviyeler array'i
- ✅ `session_id` - Oturum ID'si
- ✅ `updated_at` - Otomatik güncelleme trigger'ı

### 3. ❌ Gereksiz Tabloyu Sil (Opsiyonel)
`reading_progress` tablosunu silebilirsiniz - kodda kullanılmıyor.

---

## 📋 Adım Adım Yapılacaklar

### Adım 1: SUPABASE_MIGRATION.sql Çalıştır
1. Supabase Dashboard → SQL Editor
2. `SUPABASE_MIGRATION.sql` dosyasının içeriğini kopyala
3. Yeni query oluştur ve yapıştır
4. **Run** butonuna tıkla
5. Başarı mesajını kontrol et

### Adım 2: SUPABASE_STUDENT_PROGRESS_UPDATE.sql Çalıştır (ÖNEMLİ!)
1. Supabase Dashboard → SQL Editor
2. `SUPABASE_STUDENT_PROGRESS_UPDATE.sql` dosyasının içeriğini kopyala
3. Yeni query oluştur ve yapıştır
4. **Run** butonuna tıkla
5. Başarı mesajını kontrol et

### Adım 3: Kontrol Et
Aşağıdaki SQL sorgusunu çalıştırarak `student_progress` tablosunun yapısını kontrol edin:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'student_progress'
ORDER BY ordinal_position;
```

**Beklenen kolonlar:**
- ✅ `id` (uuid)
- ✅ `student_id` (uuid)
- ✅ `story_id` (integer)
- ✅ `current_level` (integer)
- ✅ `current_step` (integer) ← **ÖNEMLİ**
- ✅ `completed_levels` (integer[])
- ✅ `points` (integer) ← **ÖNEMLİ**
- ✅ `is_completed` (boolean) ← **ÖNEMLİ**
- ✅ `started_at` (timestamp)
- ✅ `completed_at` (timestamp)
- ✅ `updated_at` (timestamp)
- ✅ `session_id` (uuid) - opsiyonel

---

## ✅ Puan ve Seviye Geçişleri Çalışacak mı?

### Evet, çalışacak! ✅

**Şartlar:**
1. ✅ `SUPABASE_MIGRATION.sql` çalıştırıldı (yeni tablolar oluşturuldu)
2. ✅ `SUPABASE_STUDENT_PROGRESS_UPDATE.sql` çalıştırıldı (eksik kolonlar eklendi)
3. ✅ `points_history` tablosu mevcut

**Nasıl Çalışır:**
- ✅ Seviye tamamlandığında → `updateStudentProgressStep` çağrılır
- ✅ Puan verildiğinde → `awardPoints` çağrılır → `student_progress.points` güncellenir
- ✅ Puan geçmişi → `points_history` tablosuna kaydedilir
- ✅ Seviye geçişi → `current_level` ve `current_step` güncellenir
- ✅ Tamamlanan seviyeler → `completed_levels` array'ine eklenir

**Kontrol:**
- Dashboard'da puanlar görünmeli
- Seviye numarası güncellenmeli
- `points_history` tablosunda kayıtlar olmalı

---

## 🚨 Sorun Giderme

### Puanlar güncellenmiyorsa:
1. `student_progress` tablosunda `points` kolonu var mı kontrol et
2. Console'da hata var mı kontrol et
3. `awardPoints` fonksiyonu çağrılıyor mu kontrol et

### Seviye geçişi çalışmıyorsa:
1. `student_progress` tablosunda `current_level` ve `current_step` kolonları var mı kontrol et
2. `updateStudentProgressStep` fonksiyonu çağrılıyor mu kontrol et
3. `completed_levels` array kolonu var mı kontrol et

### Tablo yoksa:
- `SUPABASE_MIGRATION.sql` dosyasını tekrar çalıştırın

---

## 📝 Özet

**Yapılacaklar:**
1. ✅ `SUPABASE_MIGRATION.sql` çalıştır (yeni tablolar)
2. ✅ `SUPABASE_STUDENT_PROGRESS_UPDATE.sql` çalıştır (eksik kolonlar)
3. ✅ Kontrol et (SQL sorgusu ile)

**Sonuç:**
- ✅ Puan sistemi çalışacak
- ✅ Seviye geçişleri çalışacak
- ✅ Dashboard'da güncel bilgiler görünecek


