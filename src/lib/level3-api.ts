import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level3Step1Request,
  Level3Step1ParagraphRequest,
  Level3Step1ParagraphResponse,
} from '../types';

export async function submitParagraphReading(
  request: Level3Step1Request
): Promise<Level3Step1ParagraphResponse> {
  console.log('📤 Sending Level 3 Step 1 request:', JSON.stringify(request, null, 2));
  
  const response = await axios.post<Level3Step1ParagraphResponse>(
    `${getApiBase()}/dost/level3/step1`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('📥 Level 3 Step 1 response:', JSON.stringify(response.data, null, 2));
  
  return response.data;
}


