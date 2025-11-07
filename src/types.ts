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
