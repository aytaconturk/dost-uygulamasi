# API Endpoints Documentation

## Current API Endpoints (PRESERVE THESE)

### Voice Recording API (Currently used in ReadingScreen and Level1Steps)
- **Endpoint**: https://arge.aquateknoloji.com/webhook/faaba651-a1ad-4f6c-9062-0ebc7ca93bcb
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `ses`: audio file (mp3)
  - `kullanici_id`: user ID (currently "12345")
  - `hikaye_adi`: story name
  - `adim`: step number
  - `adim_tipi`: step type

## New API Endpoints (Added for Level 1, Step 1)

### Image Analysis API (Level 1, Step 1)
- **Endpoint**: https://arge.aquateknoloji.com/webhook-test/dost/level1
- **Method**: POST
- **Parameters**:
  - `imageUrl`: URL of the image to analyze
  - For ants story: "https://dost.muhbirai.com/src/assets/images/story1.png"

### Voice Recording API for Second Step (To be implemented)
- **Endpoint**: [TO BE DEFINED]
- **Method**: POST
- **Purpose**: Send recorded voice after microphone click
