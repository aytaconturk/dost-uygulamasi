import axios from 'axios';
import { getApiBase } from './api';
import { getVoiceResponseTimeoutSync } from '../components/SidebarSettings';
import type {
  Level4Step1Request,
  Level4Step1Response,
  Level4Step2Request,
  Level4Step2Response,
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

export async function submitSchemaSectionReading(
  request: Level4Step1Request
): Promise<Level4Step1Response> {
  // Log request without full audioBase64
  const requestForLog = {
    ...request,
    audioBase64: request.audioBase64 ? `${request.audioBase64.substring(0, 50)}... (${request.audioBase64.length} chars)` : request.audioBase64
  };
  console.log('📤 Sending Level 4 Step 1 request (schema section):', JSON.stringify(requestForLog, null, 2));
  
  const response = await axios.post<Level4Step1Response>(
    `${getApiBase()}/dost/level4/step1`,
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
  console.log('📥 Level 4 Step 1 response:', JSON.stringify(responseForLog, null, 2));
  
  return response.data;
}

export async function getResumeResponse(
  resumeUrl: string,
  request: Level4Step1Request
): Promise<Level4Step1Response> {
  // resumeUrl is a full URL like: https://arge.muhbirai.com/webhook-waiting/46487
  // Use FormData to avoid CORS preflight (no OPTIONS request needed)
  const finalUrl = resumeUrl;
  
  const payload = {
    studentId: request.studentId,
    sectionTitle: request.sectionTitle,
    paragrafText: request.paragrafText, // n8n bu field'ı bekliyor
    audioBase64: request.audioBase64,
    isLatestParagraf: request.isLatestParagraf, // n8n bu field'ı bekliyor
    paragrafNo: request.paragrafNo, // n8n bu field'ı bekliyor
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
    const response = await axios.post<Level4Step1Response>(
      finalUrl,
      formData,
      {
        withCredentials: false, // No credentials = simpler CORS
        timeout: getVoiceResponseTimeoutSync(),
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

export async function submitSchemaSummary(
  request: Level4Step2Request
): Promise<Level4Step2Response> {
  // Step2 API'si Step1 ile aynı, sadece endpoint farklı
  const requestForLog = {
    ...request,
    audioBase64: request.audioBase64 ? `${request.audioBase64.substring(0, 50)}... (${request.audioBase64.length} chars)` : request.audioBase64
  };
  console.log('📤 Sending Level 4 Step 2 request (schema summary):', JSON.stringify(requestForLog, null, 2));
  
  const response = await axios.post<Level4Step2Response>(
    `${getApiBase()}/dost/level4/step2`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const responseForLog = {
    ...response.data,
    audioBase64: response.data.audioBase64 ? `${response.data.audioBase64.substring(0, 50)}... (${response.data.audioBase64.length} chars)` : response.data.audioBase64
  };
  console.log('📥 Level 4 Step 2 response:', JSON.stringify(responseForLog, null, 2));
  
  return response.data;
}

export async function getResumeResponseStep2(
  resumeUrl: string,
  request: Level4Step2Request
): Promise<Level4Step2Response> {
  // Step2 resume API'si Step1 ile aynı
  const payload = {
    studentId: request.studentId,
    sectionTitle: request.sectionTitle,
    paragrafText: request.paragrafText, // n8n bu field'ı bekliyor
    audioBase64: request.audioBase64,
    isLatestParagraf: request.isLatestParagraf, // n8n bu field'ı bekliyor
    paragrafNo: request.paragrafNo, // n8n bu field'ı bekliyor
  };

  const requestForLog = {
    ...payload,
    audioBase64: `${payload.audioBase64.substring(0, 50)}... (${payload.audioBase64.length} chars)`
  };
  
  console.log('📤 Sending resume request to:', resumeUrl);
  console.log('📤 Using FormData (multipart/form-data) - NO CORS PREFLIGHT');
  console.log('📤 Request data:', JSON.stringify(requestForLog, null, 2));
  
  try {
    const formData = toFormData(payload);
    
    const response = await axios.post<Level4Step2Response>(
      resumeUrl,
      formData,
      {
        withCredentials: false,
        timeout: 60000,
      }
    );
    
    console.log('📥 Resume response status:', response.status);
    
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
