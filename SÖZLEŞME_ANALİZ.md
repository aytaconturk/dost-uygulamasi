# Sözleşme Tablosu - Mevcut Durum ve Eksikler Analizi

## 📊 EKRANLAR

### 0. Süper User Giriş Ekranı
**Sözleşme Gereksinimi:**
- Süper User giriş ekranı olsun
- Süper User tüm logları ve verileri görüp kontrol edebilsin
- Mail giriş veya uygun bir yöntem

**Mevcut Durum:**
- ✅ Admin paneli var (`AdminPanel.tsx`)
- ✅ Admin role kontrolü var (`RoleBasedRouter.tsx`)
- ⚠️ Süper User için özel giriş ekranı yok (şu an admin role ile giriş yapılıyor)
- ⚠️ Admin paneli logları gösteriyor ama tam monitoring dashboard yok

**Eksikler:**
- Süper User için özel login ekranı
- Tüm logları görüntüleme (api_logs, student_actions, sessions, audio_recordings)
- Detaylı istatistikler ve grafikler
- Real-time monitoring

---

### 1. Öğrenci Kullanıcı Adı ile Giriş
**Sözleşme Gereksinimi:**
- Her bir öğrencinin sisteme kullanıcı adı ile giriş yapacağı giriş ekranı

**Mevcut Durum:**
- ✅ Teacher/Student sistemi var
- ✅ StudentSelector component var
- ⚠️ Öğrenci direkt kullanıcı adı ile giriş yapmıyor, öğretmen seçiyor

**Eksikler:**
- Öğrenci için direkt kullanıcı adı/şifre girişi (opsiyonel - şu anki sistem daha kullanıcı dostu)

---

### 2. Uygulayıcı Bilgisi Ekranı (Opsiyonel)
**Sözleşme Gereksinimi:**
- Sisteme giriş yapıldıktan sonra öğrenciyi takip eden uygulayıcı bilgisinin yazılacağı bir ekran
- Opsiyonel olsun, atlanabilir

**Mevcut Durum:**
- ❌ YOK

**Eksikler:**
- Uygulayıcı bilgisi ekranı (opsiyonel, atlanabilir)
- Supabase'de uygulayıcı bilgisi tablosu

---

### 3. 24 Oturum Görüntüleme Ekranı
**Sözleşme Gereksinimi:**
- 24 oturumu bütüncül olarak gösteren bir ekran
- Çalışılıp tamamlanmayan oturumlar kilitli olsun
- Oturumlar sırayla açılsın
- Hangi oturumun hangi tarihte çalışıldığının ve girdilerin/çıktıların kaydı tutulsun

**Mevcut Durum:**
- ✅ StoryList component var
- ✅ Lock mekanizması var (`story.locked`)
- ⚠️ 24 oturum kontrolü yok (şu an 5 hikaye var)
- ⚠️ Sıralı açılma kontrolü yok
- ⚠️ Tarih ve girdi/çıktı kayıtları eksik

**Eksikler:**
- 24 oturum (story) desteği
- Sıralı kilit açma mekanizması (önceki oturum tamamlanmadan sonraki açılmaz)
- Oturum çalışma tarihleri görüntüleme
- Girdi/çıktı kayıtları görüntüleme

---

### 4. Strateji Tanıtım Animasyonu
**Sözleşme Gereksinimi:**
- İlk 3 oturum zorunlu, sonra opsiyonel
- Strateji içeriği tanıtımı ve güzel okuma kuralları öğretim animasyonu
- Video şeklinde (10 dk'dan kısa)

**Mevcut Durum:**
- ❌ YOK

**Eksikler:**
- Strateji tanıtım video component'i
- İlk 3 oturum için zorunlu kontrolü
- Video oynatma ve "Atla" butonu (4. oturumdan sonra)

---

## 📚 SEVİYELER

### 1. Seviye
**Sözleşme Gereksinimi:**
- a. Metnin görselini inceleme ve tahminde bulunma ✅
- b. Metnin başlığını inceleme ve tahminde bulunma ✅
- c. Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma ✅
- d. Okuma amacı belirleme ✅

**Mevcut Durum:**
- ✅ Tüm adımlar mevcut
- ✅ DOST maskot var
- ✅ Sesli yönlendirme var
- ⚠️ Maskot ağız hareketleri senkronizasyonu yok (sadece görsel var)

**Eksikler:**
- Maskot ağız hareketleri senkronizasyonu (konuşma sırasında)

---

### 2. Seviye
**Sözleşme Gereksinimi:**

#### a. Birinci okuma ve Okuma hızı belirleme
**A Durumu (Tercih Edilen):**
- Yapay zeka okuma hızını tespit edebilirse çok mükemmel olur
- Yanlış dahi tespit etse yanılma oranı belirlenip tolere edilebilir oran ise kabul edilebilir

**B Durumu (A olmazsa):**
- Öğrenci 60. saniyede bip sesi duyduğunda son okuduğu sözcüğe tıklayarak işaretler
- Doğru okuduğu sözcükleri sayar ve okuma hızını yazar

**Mevcut Durum:**
- ✅ Level 2 Step1 var
- ✅ API ile okuma analizi yapılıyor (`submitReadingAnalysis`)
- ✅ API response'da `wordsPerMinute`, `correctWordsPerMinute` var
- ⚠️ Şu an A durumu gibi çalışıyor (API ile otomatik tespit)
- ❌ B durumu yok (60. saniyede bip, manuel işaretleme)

**Eksikler:**
- A durumu: Yapay zeka okuma hızı tespiti - ŞU AN BU KULLANILIYOR ✅
- B durumu: Manuel işaretleme sistemi - YOK ❌
- Yanılma oranı tolerans kontrolü

#### b. Okuma hızı
**A Durumu:**
- DOST otomatik okuma hızını söyler
- Performans geri bildirimi verir

**B Durumu:**
- Öğrenci "Okuma hızım: …. Sözcük" kısmına manuel yazar

**Mevcut Durum:**
- ✅ Level 2 Step2 var
- ✅ API'den gelen okuma hızı gösteriliyor
- ⚠️ Şu an A durumu gibi çalışıyor
- ❌ B durumu yok

**Eksikler:**
- B durumu: Manuel okuma hızı girişi - YOK ❌

#### c. Okuma hedefi belirleme
**Mevcut Durum:**
- ✅ Level 2 Step3 var
- ✅ %5, %7, %10 artış seçenekleri var
- ✅ DOST geri bildirim veriyor

**Eksikler:**
- Yok (tam uyumlu)

---

### 3. Seviye
**Sözleşme Gereksinimi:**
- a. Model okuma ve İkinci okuma ✅
- b. Üçüncü okuma ve okuma hızı belirleme (A/B durumu)
- c. Okuma hızı ve Performans geribildirimi (A/B durumu)

**Mevcut Durum:**
- ✅ Level 3 Step1 var (Model okuma)
- ✅ Level 3 Step2 var (Üçüncü okuma)
- ✅ Level 3 Step3 var (Performans geribildirimi)
- ⚠️ Şu an A durumu gibi çalışıyor (API ile otomatik)
- ❌ B durumu yok

**Eksikler:**
- B durumu: Manuel okuma hızı belirleme - YOK ❌

---

### 4. Seviye
**Sözleşme Gereksinimi:**
- a. Dolu şema üzerinden beyin fırtınası yapma ve yorumda bulunma ✅
- b. Özetleme ✅
- c. Okuduğunu Anlama Soruları ✅

**Mevcut Durum:**
- ✅ Tüm adımlar mevcut
- ✅ DOST yönlendirmeleri var

**Eksikler:**
- Yok (tam uyumlu)

---

### 5. Seviye
**Sözleşme Gereksinimi:**
- a. Okuduğunu anlama soruları ✅
- b. Hedefe bağlı ödül ✅
- c. Çalışmayı sonlandırma ✅

**Mevcut Durum:**
- ✅ Tüm adımlar mevcut
- ✅ Ödül oluşturma var

**Eksikler:**
- Yok (tam uyumlu)

---

## 🎯 ÖZEL GEREKSİNİMLER

### Maskot Ağız Hareketleri
**Sözleşme Gereksinimi:**
- DOST maskot şeklinde görünebilir
- Konuşmalarda maskotun ağız hareketleri senkron bir biçimde hareket edebilir

**Mevcut Durum:**
- ✅ DostMascot component var
- ❌ Ağız hareketleri senkronizasyonu yok

**Eksikler:**
- Konuşma sırasında maskot ağız hareket animasyonu

---

### Okuma Amacı Belirleme (1. Seviye d.)
**Sözleşme Gereksinimi:**
- Hayvanlarla ilgili metinlerde: hayvanların yaşayışları, fiziksel özellikleri, beslenmeleri, çoğalmaları, çevreye etkileri hakkında bilgi sahibi olmak
- Bitkilerle ilgili metinlerde: bitkilerin yaşam koşulları, fiziksel özellikleri, çoğalmaları, çevreye etkileri
- Elektronik araçlarla ilgili metinlerde: kullanım amaçları, fiziksel özellikleri, çalışma biçimleri, üretimleri, çevreye etkileri
- Coğrafi Bölgelerle ilgili metinlerde: iklimi, bitki örtüsü, yeryüzü özellikleri, ekonomik faaliyetleri, nüfus ve yerleşmesi

**Mevcut Durum:**
- ✅ Level 1 Step4 var
- ⚠️ API'ye gönderiliyor ama metin tipine göre özel mesaj kontrolü yok

**Eksikler:**
- Metin tipine göre (hayvan/bitki/elektronik/coğrafi) özel okuma amacı mesajları

---

## 📋 ÖZET: EKSİKLER LİSTESİ

### 🔴 Kritik Eksikler
1. **24 Oturum Sistemi**
   - 24 oturum (story) desteği
   - Sıralı kilit açma mekanizması
   - Oturum çalışma tarihleri görüntüleme

2. **Uygulayıcı Bilgisi Ekranı**
   - Opsiyonel uygulayıcı bilgisi ekranı
   - Supabase tablosu

3. **Strateji Tanıtım Animasyonu**
   - İlk 3 oturum için zorunlu video
   - 4. oturumdan sonra opsiyonel

4. **Süper User Giriş Ekranı**
   - Özel Süper User login
   - Tam monitoring dashboard

### 🟡 Orta Öncelikli Eksikler
5. **B Durumu (Manuel Okuma Hızı)**
   - Level 2 Step1: 60. saniyede bip, manuel işaretleme
   - Level 2 Step2: Manuel okuma hızı girişi
   - Level 3 Step2: Manuel okuma hızı belirleme
   - Level 3 Step3: Manuel okuma hızı girişi

6. **Maskot Ağız Hareketleri**
   - Konuşma sırasında senkron ağız hareket animasyonu

7. **Okuma Amacı Belirleme - Metin Tipine Göre**
   - Hayvan/bitki/elektronik/coğrafi bölge için özel mesajlar

### 🟢 Düşük Öncelikli / İyileştirmeler
8. **Öğrenci Direkt Giriş**
   - Kullanıcı adı/şifre ile direkt giriş (şu anki sistem daha kullanıcı dostu)

---

## ✅ TAM UYUMLU ÖZELLİKLER

1. ✅ Level 1 tüm adımlar
2. ✅ Level 2 Step3 (Okuma hedefi belirleme)
3. ✅ Level 3 Step1 (Model okuma)
4. ✅ Level 4 tüm adımlar
5. ✅ Level 5 tüm adımlar
6. ✅ A Durumu (Yapay zeka okuma hızı tespiti) - Level 2 ve 3'te kullanılıyor
7. ✅ DOST maskot görseli
8. ✅ Sesli yönlendirmeler
9. ✅ Story lock mekanizması (temel)
10. ✅ Session takibi
11. ✅ Step completion tracking




