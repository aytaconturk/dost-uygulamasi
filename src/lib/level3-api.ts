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

export async function getResumeResponse(
  resumeUrl: string
): Promise<Level3Step1Response> {
  console.log('📤 Fetching resume response from:', resumeUrl);
  
  const response = await axios.get<Level3Step1Response>(resumeUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Log response without full audioBase64
  const responseForLog = {
    ...response.data,
    audioBase64: response.data.audioBase64 ? `${response.data.audioBase64.substring(0, 50)}... (${response.data.audioBase64.length} chars)` : response.data.audioBase64
  };
  console.log('📥 Resume response:', JSON.stringify(responseForLog, null, 2));
    
  return response.data;
}


