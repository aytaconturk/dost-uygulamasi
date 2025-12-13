import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level3Step1Request,
  Level3Step1ParagraphRequest,
  Level3Step1ParagraphResponse,
  Level3Step1Response,
} from '../types';

// Helper: Convert payload to FormData to avoid CORS preflight
function toFormData(payload: Record<string, any>): FormData {
  const fd = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;

    // Convert boolean/number to string for FormData
    if (typeof value === 'boolean' || typeof value === 'number') {
      fd.append(key, String(value));
    } else if (typeof value === 'object' && !(value instanceof Blob) && !(value instanceof File)) {
      // Serialize objects as JSON string
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value as any);
    }
  }

  return fd;
}

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

export async function getResumeResponse(
  resumeUrl: string,
  request: Level3Step1Request
): Promise<Level3Step1Response> {
  // resumeUrl is a full URL like: https://arge.aquateknoloji.com/webhook-waiting/46487
  // Use FormData to avoid CORS preflight (no OPTIONS request needed)
  const finalUrl = resumeUrl;
  
  const payload = {
    studentId: request.studentId,
    paragrafText: request.paragrafText,
    audioBase64: request.audioBase64,
    isLatestParagraf: request.isLatestParagraf,
    paragrafNo: request.paragrafNo,
  };

  // Log request without full audioBase64
  const requestForLog = {
    ...payload,
    audioBase64: `${payload.audioBase64.substring(0, 50)}... (${payload.audioBase64.length} chars)`
  };
  
  console.log('📤 Sending resume request to:', finalUrl);
  console.log('📤 Using FormData (multipart/form-data) - NO CORS PREFLIGHT');
  console.log('📤 Request data:', JSON.stringify(requestForLog, null, 2));
  
  try {
    // Convert to FormData - this avoids CORS preflight!
    const formData = toFormData(payload);
    
    // IMPORTANT: Do NOT set Content-Type header when using FormData
    // Browser will set it automatically with boundary
    const response = await axios.post<Level3Step1Response>(
      finalUrl,
      formData,
      {
        withCredentials: false, // No credentials = simpler CORS
        timeout: 60000, // 60 second timeout
        // NO headers! Let browser set multipart/form-data automatically
      }
    );
    
    console.log('📥 Resume response status:', response.status);
    console.log('📥 Resume response headers:', response.headers);
    
    // Log response without full audioBase64
    const responseForLog = {
      ...response.data,
      audioBase64: response.data?.audioBase64 ? `${response.data.audioBase64.substring(0, 50)}... (${response.data.audioBase64.length} chars)` : response.data?.audioBase64
    };
    console.log('📥 Resume response data:', JSON.stringify(responseForLog, null, 2));
      
    return response.data;
  } catch (error: any) {
    console.error('❌ Error with resumeUrl:', {
      url: resumeUrl,
      error: error.message,
      code: error.code,
      response: error.response?.data,
    });
    throw error;
  }
}


