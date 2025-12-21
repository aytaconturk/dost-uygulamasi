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
  console.log('📤 Sending Level 2 Step 1 reading analysis:', {
    sessionId: request.sessionId,
    studentId: request.studentId, // backward compat
    textTitle: request.textTitle,
    originalTextLength: request.originalText?.length || 0,
    audioBase64Length: request.audioBase64?.length || 0,
  });
  
  const response = await axios.post<Level2Step1ReadingAnalysisResponse>(
    `${getApiBase()}/dost/level2/step1`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('📥 Level 2 Step 1 response:', {
    ok: response.data.ok,
    hasTranscript: !!response.data.output?.transcript,
    overallScore: response.data.output?.overallScore,
    speechRate: response.data.output?.speechRate,
  });
  
  return response.data;
}

export async function submitReadingGoalSelection(
  request: Level2Step3GoalSelectionRequest
): Promise<Level2Step3GoalSelectionResponse> {
  console.log('📤 Sending Level 2 Step 3 goal selection:', {
    sessionId: request.sessionId,
    studentId: request.studentId, // backward compat
    hedefNo: request.hedefNo,
    selectedGoal: request.selectedGoal,
  });
  
  const response = await axios.post<Level2Step3GoalSelectionResponse>(
    `${getApiBase()}/dost/level2/step3`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('📥 Level 2 Step 3 response:', {
    ok: response.data.ok,
    audioBase64Length: response.data.audioBase64?.length || 0,
  });
  
  return response.data;
}
