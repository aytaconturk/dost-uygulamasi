import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level1ImageAnalysisRequest,
  Level1ImageAnalysisResponse,
  Level1ChildrenVoiceResponse,
  Level1TitleAnalysisRequest,
  Level1TitleAnalysisResponse,
  Level1SentencesAnalysisRequest,
  Level1SentencesAnalysisResponse,
  Level1ObjectiveAnalysisRequest,
  Level1ObjectiveAnalysisResponse,
} from '../types';

/**
 * Analyzes the story image and returns explanation, audio, and resumeUrl
 */
export async function analyzeStoryImage(
  request: Level1ImageAnalysisRequest
): Promise<Level1ImageAnalysisResponse> {
  const { data } = await axios.post<Level1ImageAnalysisResponse>(
    `${getApiBase()}/dost/level1`,
    request,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return data;
}

/**
 * Analyzes story title for Step 2
 * Returns audioBase64 for playback and resumeUrl for voice submission
 */
export async function analyzeTitleForStep2(
  request: Level1TitleAnalysisRequest
): Promise<Level1TitleAnalysisResponse> {
  const { data } = await axios.post<Level1TitleAnalysisResponse>(
    `${getApiBase()}/dost/level1/step2`,
    request,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return data;
}

/**
 * Analyzes story sentences for Step 3
 * Returns audioBase64 for playback and resumeUrl for voice submission
 */
export async function analyzeSentencesForStep3(
  request: Level1SentencesAnalysisRequest
): Promise<Level1SentencesAnalysisResponse> {
  const { data } = await axios.post<Level1SentencesAnalysisResponse>(
    `${getApiBase()}/dost/level1/step3`,
    request,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return data;
}

/**
 * Analyzes reading objective for Step 4
 * Returns audioBase64 for playback and resumeUrl for voice submission
 */
export async function analyzeObjectiveForStep4(
  request: Level1ObjectiveAnalysisRequest
): Promise<Level1ObjectiveAnalysisResponse> {
  const { data } = await axios.post<Level1ObjectiveAnalysisResponse>(
    `${getApiBase()}/dost/level1/step4`,
    request,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return data;
}

/**
 * Submits children's voice recording for analysis
 * Uses the resumeUrl from the image analysis response or title analysis response
 */
export async function submitChildrenVoice(
  audioBlob: Blob,
  resumeUrl: string,
  storyTitle: string,
  stepNum: number = 1,
  stepType: string = 'gorsel_tahmini',
  userIdForAnalysis: string = '12345'
): Promise<Level1ChildrenVoiceResponse> {
  const file = new File([audioBlob], 'cocuk_sesi.mp3', { type: 'audio/mp3' });
  const formData = new FormData();
  formData.append('ses', file);
  formData.append('kullanici_id', userIdForAnalysis);
  formData.append('hikaye_adi', storyTitle);
  formData.append('adim', String(stepNum));
  formData.append('adim_tipi', stepType);

  const { data } = await axios.post<Level1ChildrenVoiceResponse>(
    resumeUrl,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return data;
}
