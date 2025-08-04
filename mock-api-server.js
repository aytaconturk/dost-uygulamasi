const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Mock voice analysis endpoint
app.post('/api/voice-analysis', upload.single('audio'), (req, res) => {
  console.log('Received audio file:', req.file);
  console.log('Request body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  
  // Mock analysis responses based on step/level
  const step = req.body.step;
  const level = req.body.level;
  
  const mockResponses = [
    "Çok güzel konuştun! Karıncaları iyi gözlemlediğin anlaşılıyor.",
    "Harika! Karıncaların çalışkanlığı hakkında çok doğru düşünüyorsun.",
    "Mükemmel! Ses kaydın çok net ve anlaşılır.",
    "Bravo! Hikaye hakkındaki düşüncelerin çok değerli."
  ];
  
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      message: randomResponse,
      audioFile: req.file.filename,
      analysisData: {
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        sentiment: 'positive',
        keywords: ['karınca', 'çalışkan', 'güzel'],
        duration: '3.2s',
        quality: 'good'
      }
    });
  }, 1500);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock API server is running' });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- POST /api/voice-analysis (for audio uploads)');
  console.log('- GET /api/health (health check)');
});
