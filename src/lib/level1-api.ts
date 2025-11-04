import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level1ImageAnalysisRequest,
  Level1ImageAnalysisResponse,
  Level1ChildrenVoiceResponse,
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
 * Submits children's voice recording for analysis
 * Uses the resumeUrl from the image analysis response
 */
export async function submitChildrenVoice(
  audioBlob: Blob,
  resumeUrl: string,
  storyTitle: string,
  userIdForAnalysis: string = '12345'
): Promise<Level1ChildrenVoiceResponse> {
  const file = new File([audioBlob], 'cocuk_sesi.mp3', { type: 'audio/mp3' });
  const formData = new FormData();
  formData.append('ses', file);
  formData.append('kullanici_id', userIdForAnalysis);
  formData.append('hikaye_adi', storyTitle);
  formData.append('adim', '1');
  formData.append('adim_tipi', 'gorsel_tahmini');

  const { data } = await axios.post<Level1ChildrenVoiceResponse>(
    resumeUrl,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return data;
}
