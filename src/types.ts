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

  export interface Level2Step1ReadingAnalysisRequest {
    studentId: string;
    originalText: string;
    audioFile: string;
    startTime: string;
    endTime: string;
    metadata: RecordingMetadata;
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
    studentId: string;
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
    studentId: string;
    paragrafText: string;
    audioBase64: string;
    isLatestParagraf: boolean;
    paragrafNo: number;
  }

  export interface Level3Step1ParagraphRequest {
    userId: string;
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
