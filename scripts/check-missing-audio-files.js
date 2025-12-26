import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, '..', 'public', 'audios', 'sorular');

// Tüm hikayeler ve soru sayıları
const STORIES = {
  1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7, 8: 7, 9: 7, 10: 7, 11: 7
};

const missingFiles = [];

// Her hikaye için kontrol et
for (const [storyId, questionCount] of Object.entries(STORIES)) {
  for (let q = 1; q <= questionCount; q++) {
    const questionId = `q${q}`;
    
    // Kontrol edilecek dosyalar
    const files = [
      `question-${storyId}-${questionId}.mp3`,
      `option-${storyId}-${questionId}-A.mp3`,
      `option-${storyId}-${questionId}-B.mp3`,
      `option-${storyId}-${questionId}-C.mp3`,
      `option-${storyId}-${questionId}-D.mp3`,
      `correct-${storyId}-${questionId}.mp3`,
      `wrong-${storyId}-${questionId}.mp3`,
    ];
    
    for (const file of files) {
      const filePath = path.join(audioDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
  }
}

if (missingFiles.length === 0) {
  console.log('✅ Tüm dosyalar mevcut!');
} else {
  console.log(`❌ ${missingFiles.length} dosya eksik:`);
  missingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
}


