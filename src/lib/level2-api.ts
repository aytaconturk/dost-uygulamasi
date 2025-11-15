import axios from 'axios';
import { getApiBase } from './api';
import type {
  Level2Step1ReadingAnalysisRequest,
  Level2Step1ReadingAnalysisResponse,
  Level2Step3GoalSelectionRequest,
  Level2Step3GoalSelectionResponse,
} from '../types';

export async function submitReadingAnalysis(
  request: Level2Step1ReadingAnalysisRequest
): Promise<Level2Step1ReadingAnalysisResponse> {
  const response = await axios.post<Level2Step1ReadingAnalysisResponse>(
    `${getApiBase()}/dost/level2/step1`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

export async function submitReadingGoalSelection(
  request: Level2Step3GoalSelectionRequest
): Promise<Level2Step3GoalSelectionResponse> {
  const response = await axios.post<Level2Step3GoalSelectionResponse>(
    `${getApiBase()}/dost/level2/step3`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}
