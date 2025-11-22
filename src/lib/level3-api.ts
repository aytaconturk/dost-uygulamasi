import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level3Step1ParagraphRequest,
  Level3Step1ParagraphResponse,
} from '../types';

export async function submitParagraphReading(
  request: Level3Step1ParagraphRequest
): Promise<Level3Step1ParagraphResponse> {
  const response = await axios.post<Level3Step1ParagraphResponse>(
    `${getApiBase()}/dost/level3/step1`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}


