export interface Step {
    id: number;
    type: 'image' | 'title' | 'audio';
    prompt: string;
    options?: string[];
    content?: string;
  }

  export interface AudioResponse {
    success: boolean;
    message?: string;
  }

  // Level 1 - Image Analysis API Types
  export interface Level1ImageAnalysisRequest {
    imageUrl: string;
    stepNum: number;
    storyTitle: string;
    userId: string;
    userName: string;
    ilkUcParagraf: string[];
    metin: string;
  }

  export interface Level1ImageAnalysisResponse {
    audioBase64?: string;
    imageExplanation: string;
    resumeUrl: string;
    title: string;
    message?: string;
    text?: string;
    response?: string;
  }

  // Level 1 - Children Voice API Types
  export interface Level1ChildrenVoiceRequest {
    ses: Blob;
    kullanici_id: string;
    hikaye_adi: string;
    adim: string;
    adim_tipi: string;
  }

  export interface Level1ChildrenVoiceResponse {
    respodKidVoice: string;
    audioBase64: string;
    message?: string;
    text?: string;
    response?: string;
    resumeUrl?: string;
    textAudio?: string;
  }

  // Level 1 Step 2 - Title Analysis API Types
  export interface Level1TitleAnalysisRequest {
    stepNum: number;
    userId: string;
  }

  export interface Level1TitleAnalysisResponse {
    title: string;
    userId: string;
    audioBase64: string;
    resumeUrl: string;
    titleExplanation?: string;
    imageExplanation?: string;
    message?: string;
    text?: string;
    textAudio?: string;
    response?: string;
  }

  // Level 1 Step 3 - Sentences Analysis API Types
  export interface Level1SentencesAnalysisRequest {
    stepNum: number;
    userId: string;
  }

  export interface Level1SentencesAnalysisResponse {
    answer: string;
    audioBase64: string;
    resumeUrl: string;
    message?: string;
    text?: string;
    response?: string;
  }

  // Level 1 Step 4 - Reading Objective API Types
  export interface Level1ObjectiveAnalysisRequest {
    stepNum: number;
    userId: string;
  }

  export interface Level1ObjectiveAnalysisResponse {
    answer: string;
    audioBase64: string;
    resumeUrl: string;
    message?: string;
    text?: string;
    response?: string;
    textAudio?: string;
  }

  // Level 2 Step 1 - Reading Analysis API Types
  export interface RecordingMetadata {
    level: number;
    sessionId: string;
  }

  /**
   * ⚠️ ÖNEMLİ: n8n API Entegrasyonu için Alan Adlandırma Kuralı
   * 
   * n8n workflow'ları "studentId" veya "userId" alan adlarını bekliyor.
   * Ancak değer olarak sessionId gönderiliyor (her session için unique UUID).
   * 
   * Neden?
   * - Aynı kullanıcı (student) farklı hikayelerde çalışabilir
   * - userId ile gönderildiğinde hikayeler n8n tarafında karışıyordu
   * - sessionId ile her oturum unique olarak takip ediliyor
   * 
   * Alan adı: studentId/userId (n8n bunu bekliyor - DEĞİŞTİRME!)
   * Değer: sessionId (StepContext'ten alınıyor)
   */
  export interface Level2Step1ReadingAnalysisRequest {
    studentId: string; // ⚠️ n8n bu alanı bekliyor - değer olarak sessionId gönderilecek
    textTitle?: string;
    originalText: string;
    audioBase64: string; // Base64 encoded audio data
    audio?: {
      base64: string;
      mimeType: string;
      fileName: string;
    };
    startTime: string;
    endTime: string;
    selectedWordCount?: number;
    metadata?: RecordingMetadata;
  }

  export interface ReadingDuration {
    totalSeconds: number;
    totalMinutes: number;
  }

  export interface WordCount {
    original: number;
    spoken: number;
    correct: number;
  }

  export interface ReadingSpeed {
    wordsPerMinute: number;
    correctWordsPerMinute: number;
  }

  export interface PronunciationError {
    expected: string;
    actual: string;
    position: number;
  }

  export interface Pronunciation {
    accuracy: number;
    errors: PronunciationError[];
  }

  export interface QualityRule {
    score: number;
    feedback: string;
  }

  export interface QualityRules {
    speechRate: QualityRule;
    correctWords: QualityRule;
    punctuation: QualityRule;
    expressiveness: QualityRule;
  }

  export interface GoalSuggestions {
    increase5Percent: number;
    increase7Percent: number;
    increase10Percent: number;
  }

  export interface ReadingAnalysis {
    duration: ReadingDuration;
    wordCount: WordCount;
    readingSpeed: ReadingSpeed;
    pronunciation: Pronunciation;
    qualityRules: QualityRules;
    overallScore: number;
    recommendations: string[];
    goalSuggestions: GoalSuggestions;
  }

  export interface Level2Step1ReadingAnalysisResponseData {
    studentId: string;
    analysis: ReadingAnalysis;
    transcript: string;
    timestamp: string;
  }

  export interface Level2Step1ReadingAnalysisResponse {
    success: boolean;
    data: Level2Step1ReadingAnalysisResponseData;
  }

  // Level 2 Step 3 - Reading Goal API Types
  export interface Level2Step3GoalSelectionRequest {
    studentId: string; // ⚠️ n8n bu alanı bekliyor - değer olarak sessionId gönderilecek
    storyId: number;
    level: number;
    step: number;
    targetWpm: number;
    percentage: number;
    baseWpm: number;
  }

  export interface Level2Step3GoalSelectionResponse {
    audioBase64: string;
    message?: string;
    text?: string;
    response?: string;
  }

  // Level 3 Step 1 - Paragraph Reading API Types
  // New Level 3 Step 1 Request Interface
  export interface Level3Step1Request {
    studentId: string; // ⚠️ n8n bu alanı bekliyor - değer olarak sessionId gönderilecek
    paragrafText: string;
    audioBase64: string;
    isLatestParagraf: boolean;
    paragrafNo: number;
  }

  export interface Level3Step1ParagraphRequest {
    userId: string; // ⚠️ n8n bu alanı bekliyor - değer olarak sessionId gönderilecek
    paragraphText: string;
    audioBase64: string;
    paragraphNo: number;
    storyId: number;
  }

  export interface Level3Step1ParagraphResponse {
    audioBase64: string;
    text: string;
    message?: string;
    response?: string;
  }

  // New Level 3 Step 1 Response Interface
  export interface Level3Step1Response {
    audioBase64: string;
    resumeUrl: string;
    textAudio?: string;
    title?: string;
  }

  // Level 3 Step 2 - Reading Speed Analysis API Types
  export interface Level3Step2Request {
    userId: string; // ⚠️ n8n bu alanı bekliyor - değer olarak sessionId gönderilecek
    audioFile: Blob;
    durationMs: number;
    hedefOkuma: number;
    metin: string;
    startTime?: string; // ISO timestamp
    endTime?: string; // ISO timestamp
    mimeType?: string; // e.g., 'audio/webm', 'audio/mp4'
    fileName?: string; // e.g., 'recording.webm'
  }

  export interface Level3Step2Response {
    kidName: string;
    title: string;
    speedSummary: string;
    hedefOkuma: number;
    reachedTarget: boolean;
    analysisText: string;
    metrics: {
      durationSec: number;
      durationMMSS: string;
      targetWordCount: number;
      spokenWordCount: number;
      matchedWordCount: number;
      accuracyPercent: number;
      wpmSpoken: number;
      wpmCorrect: number;
      wpmTarget: number;
    };
    coachText: string;
    audioBase64: string;
    transcriptText: string;
  }

  // Level 4 Step 1 - Schema Section Reading API Types
  // Level 4 Step 2 - Summary API Types (Step1 ile aynı yapı)
  // ⚠️ NOT: n8n workflow paragrafText, isLatestParagraf, paragrafNo bekliyor
  export interface Level4Step2Request {
    studentId: string;
    sectionTitle: string;
    paragrafText: string; // n8n bu field'ı bekliyor
    audioBase64: string;
    isLatestParagraf: boolean; // n8n bu field'ı bekliyor
    paragrafNo: number; // n8n bu field'ı bekliyor
  }

  export interface Level4Step2Response {
    audioBase64: string;
    resumeUrl: string;
    textAudio?: string;
    title?: string;
  }

  // ⚠️ NOT: n8n workflow paragrafText, isLatestParagraf, paragrafNo bekliyor
  export interface Level4Step1Request {
    studentId: string;
    sectionTitle: string;
    paragrafText: string; // n8n bu field'ı bekliyor
    audioBase64: string;
    isLatestParagraf: boolean; // n8n bu field'ı bekliyor
    paragrafNo: number; // n8n bu field'ı bekliyor
  }

  export interface Level4Step1Response {
    audioBase64: string;
    resumeUrl: string;
    textAudio?: string;
    title?: string;
  }
