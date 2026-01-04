import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

// API Keys (from .env - in production use dotenv)
// Set these as environment variables: OPENAI_API_KEY, REPLICATE_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || '';
const REPLICATE_SDXL_VERSION = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

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

// ============================================
// Level 5 - Whisper Transcription Endpoint
// ============================================
app.post('/api/whisper/transcribe', upload.single('audio'), async (req, res) => {
  console.log('[Whisper] Received audio file:', req.file?.originalname, req.file?.size, 'bytes');
  
  if (!req.file) {
    return res.status(400).json({ error: 'Ses dosyası gerekli' });
  }

  try {
    // Create form data for OpenAI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'tr');

    console.log('[Whisper] Sending to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whisper] OpenAI error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('[Whisper] Transcription:', data.text);

    res.json({ success: true, text: data.text });
  } catch (error) {
    console.error('[Whisper] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Level 5 - Replicate Image Generation Endpoint
// ============================================
app.post('/api/replicate/generate', async (req, res) => {
  const { prompt } = req.body;
  console.log('[Replicate] Generating image for:', prompt);

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt gerekli' });
  }

  try {
    // Enhanced child-friendly prompt
    const enhancedPrompt = `A cute, colorful, child-friendly illustration of ${prompt}. Digital art, vibrant colors, cartoon style, safe for children, happy atmosphere, no scary elements.`;

    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: REPLICATE_SDXL_VERSION,
        input: {
          prompt: enhancedPrompt,
          negative_prompt: 'scary, violent, blood, horror, adult content, nsfw, weapons, dark, creepy, ugly, blurry',
          width: 768,
          height: 768,
          num_inference_steps: 25,
          guidance_scale: 7.5,
          scheduler: 'K_EULER',
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[Replicate] Create error:', errorText);
      return res.status(createResponse.status).json({ error: errorText });
    }

    let prediction = await createResponse.json();
    console.log('[Replicate] Prediction created:', prediction.id);

    // Poll for completion (max 60 seconds)
    const maxAttempts = 30;
    let attempts = 0;

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
      });

      prediction = await pollResponse.json();
      attempts++;
      console.log(`[Replicate] Poll ${attempts}: ${prediction.status}`);
    }

    if (prediction.status === 'failed') {
      console.error('[Replicate] Failed:', prediction.error);
      return res.status(500).json({ error: 'Görsel oluşturma başarısız' });
    }

    if (prediction.status !== 'succeeded') {
      return res.status(504).json({ error: 'Zaman aşımı' });
    }

    const imageUrl = prediction.output?.[0];
    console.log('[Replicate] Success! Image URL:', imageUrl);

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('[Replicate] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
  res.json({ status: 'OK', message: 'API server is running' });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- POST /api/whisper/transcribe (audio → text)');
  console.log('- POST /api/replicate/generate (prompt → image)');
  console.log('- POST /api/voice-analysis (for audio uploads)');
  console.log('- GET /api/health (health check)');
});
