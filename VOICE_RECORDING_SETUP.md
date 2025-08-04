# Ses Kaydı Kurulumu

Bu uygulama artık her adımda mikrofon butonu ile ses kaydı alabilir ve MP3 formatında API'ye gönderebilir.

## Özellikler

✅ **Web Audio API** kullanarak ses kaydı  
✅ **MP3 formatına dönüştürme** (lamejs kullanarak)  
✅ **API entegrasyonu** FormData ile  
✅ **Çevrimdışı mod** desteği  
✅ **Ses oynatma** özelliği  
✅ **Responsive tasarım**  

## Kurulum

### 1. Bağımlılıklar yüklendi:
```bash
npm install lamejs express multer cors concurrently
```

### 2. API Sunucusu
Mock API sunucusu için (isteğe bağlı):
```bash
# API sunucusunu başlat
npm run api:mock

# Veya hem API hem de dev server'ı birlikte
npm run dev:full
```

## Kullanım

1. **Seviye 1 Steps** bileşeninde 3. adımda ses kaydı butonu görünür
2. **"Kaydı Başlat"** butonuna tıklayın
3. Konuşun ve **"Kaydı Durdur"** butonuna tıklayın
4. **"Dinle"** butonuyla kaydınızı kontrol edin
5. **"Gönder"** butonuyla MP3 dosyasını API'ye gönderin

## API Entegrasyonu

### Endpoint
```
POST /api/voice-analysis
```

### İstek Formatı
```javascript
FormData {
  audio: File (MP3),
  step: string,
  level: string
}
```

### Yanıt Formatı
```javascript
{
  success: boolean,
  message: string,
  audioFile: string,
  analysisData: {
    confidence: number,
    sentiment: string,
    keywords: string[],
    duration: string,
    quality: string
  }
}
```

## Güvenlik

- Kullanıcının mikrofon iznine ihtiyaç duyar
- Ses dosyaları lokal olarak işlenir
- API gönderimi isteğe bağlıdır
- Çevrimdışı mod otomatik devreye girer

## Dosya Yapısı

```
src/components/
├── VoiceRecorder.tsx      # Ana ses kaydı bileşeni
├── Level1Steps.tsx        # Ses kaydı entegrasyonu
└── ...

mock-api-server.js         # Test API sunucusu
uploads/                   # Yüklenen ses dosyaları
```

## Sorun Giderme

### Mikrofon İzni
Tarayıcı mikrofon iznini reddederse, site ayarlarından izni manuel olarak verin.

### API Bağlantısı
API mevcut değilse otomatik olarak çevrimdışı mod devreye girer.

### MP3 Dönüştürme
lamejs kütüphanesi client-side MP3 encoding sağlar. Büyük dosyalar için biraz süre alabilir.
