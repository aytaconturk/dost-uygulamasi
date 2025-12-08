import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level3Step1Request,
  Level3Step1ParagraphRequest,
  Level3Step1ParagraphResponse,
  Level3Step1Response,
} from '../types';

export async function submitParagraphReading(
  request: Level3Step1Request
): Promise<Level3Step1Response> {
  // Log request without full audioBase64
  const requestForLog = {
    ...request,
    audioBase64: request.audioBase64 ? `${request.audioBase64.substring(0, 50)}... (${request.audioBase64.length} chars)` : request.audioBase64
  };
  console.log('📤 Sending Level 3 Step 1 request (first paragraph):', JSON.stringify(requestForLog, null, 2));
  
  const response = await axios.post<Level3Step1Response>(
    `${getApiBase()}/dost/level3/step1`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  // Log response without full audioBase64
  const responseForLog = {
    ...response.data,
    audioBase64: response.data.audioBase64 ? `${response.data.audioBase64.substring(0, 50)}... (${response.data.audioBase64.length} chars)` : response.data.audioBase64
  };
  console.log('📥 Level 3 Step 1 response:', JSON.stringify(responseForLog, null, 2));
  
  return response.data;
}


// Helper function to convert base64 string to Blob
function base64ToBlob(base64: string, mimeType: string = 'audio/mp3'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export async function getResumeResponse(
  resumeUrl: string,
  request: Level3Step1Request
): Promise<Level3Step1Response> {
  // resumeUrl is a full URL like: https://arge.aquateknoloji.com/webhook-waiting/46487
  // Use FormData like Level 1 (which works without CORS issues)
  // But convert audioBase64 to Blob first
  const finalUrl = resumeUrl;
  
  // Convert audioBase64 to Blob (like Level 1 does)
  const audioBlob = base64ToBlob(request.audioBase64, 'audio/mp3');
  const audioFile = new File([audioBlob], 'paragraf_sesi.mp3', { type: 'audio/mp3' });
  
  // Create FormData exactly like Level 1
  const formData = new FormData();
  formData.append('ses', audioFile);
  formData.append('studentId', String(request.studentId));
  formData.append('paragrafText', request.paragrafText);
  formData.append('isLatestParagraf', String(request.isLatestParagraf));
  formData.append('paragrafNo', String(request.paragrafNo));
  
  console.log('📤 Sending resume request to:', finalUrl);
  console.log('📤 Using FormData (multipart/form-data) like Level 1');
  console.log('📤 FormData fields:', {
    studentId: request.studentId,
    paragrafText: request.paragrafText,
    isLatestParagraf: request.isLatestParagraf,
    paragrafNo: request.paragrafNo,
    audioFile: `Blob (${audioBlob.size} bytes)`
  });
  
  try {
    const response = await axios.post<Level3Step1Response>(
      finalUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Log response without full audioBase64
    const responseForLog = {
      ...response.data,
      audioBase64: response.data.audioBase64 ? `${response.data.audioBase64.substring(0, 50)}... (${response.data.audioBase64.length} chars)` : response.data.audioBase64
    };
    console.log('📥 Resume response:', JSON.stringify(responseForLog, null, 2));
      
    return response.data;
  } catch (error: any) {
    // If CORS error, log it with more details
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      console.error('❌ CORS Error with resumeUrl:', {
        originalUrl: resumeUrl,
        finalUrl: finalUrl,
        error: error.message,
        suggestion: 'Backend CORS settings may need to allow multipart/form-data for this endpoint.'
      });
    }
    throw error;
  }
}


