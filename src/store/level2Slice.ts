import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ReadingAnalysisResult {
  overallScore: number;
  readingSpeed: {
    wordsPerMinute: number;
    correctWordsPerMinute: number;
  };
  wordCount: {
    original: number;
    spoken: number;
    correct: number;
  };
  qualityRules: Record<string, { score: number; feedback: string }>;
  pronunciation?: {
    accuracy: number;
    errors: Array<{ expected: string; actual: string }>;
  };
  recommendations?: string[];
  goalSuggestions?: {
    increase5Percent: number;
    increase7Percent: number;
    increase10Percent: number;
  };
  transcript?: string;
}

export interface Level2State {
  analysisResult: ReadingAnalysisResult | null;
  selectedGoal: number | null;
  selectedGoalPercentage: number | null;
  isLoading: boolean;
  level3FeedbackAudio: string | null; // Base64 encoded audio for Level3 Step3 feedback
}

const initialState: Level2State = {
  analysisResult: null,
  selectedGoal: null,
  selectedGoalPercentage: null,
  isLoading: false,
  level3FeedbackAudio: null,
};

const level2Slice = createSlice({
  name: 'level2',
  initialState,
  reducers: {
    setAnalysisResult: (state, action: PayloadAction<ReadingAnalysisResult>) => {
      state.analysisResult = action.payload;
    },
    setSelectedGoal: (state, action: PayloadAction<{ goal: number; percentage: number }>) => {
      state.selectedGoal = action.payload.goal;
      state.selectedGoalPercentage = action.payload.percentage;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLevel3FeedbackAudio: (state, action: PayloadAction<string | null>) => {
      state.level3FeedbackAudio = action.payload;
    },
    clearLevel2State: (state) => {
      state.analysisResult = null;
      state.selectedGoal = null;
      state.selectedGoalPercentage = null;
      state.isLoading = false;
      state.level3FeedbackAudio = null;
    },
  },
});

export const { setAnalysisResult, setSelectedGoal, setIsLoading, setLevel3FeedbackAudio, clearLevel2State } = level2Slice.actions;
export default level2Slice.reducer;
