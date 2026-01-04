import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Level 3 Step 2 API yanıt yapısı
export interface Level3Step2Metrics {
  durationSec: number;
  durationMMSS: string;
  targetWordCount: number;
  spokenWordCount: number;
  matchedWordCount: number;
  accuracyPercent: number;
  wpmSpoken: number;
  wpmCorrect: number;
}

export interface Level3Step2AnalysisResult {
  speedSummary: string;
  hedefOkuma: number;
  reachedTarget: boolean;
  analysisText: string;
  metrics: Level3Step2Metrics;
  coachText: string;
  audioBase64?: string;
  transcriptText: string;
  resumeUrl?: string;
}

export interface Level3State {
  step2Analysis: Level3Step2AnalysisResult | null;
  isLoading: boolean;
}

const initialState: Level3State = {
  step2Analysis: null,
  isLoading: false,
};

const level3Slice = createSlice({
  name: 'level3',
  initialState,
  reducers: {
    setStep2Analysis: (state, action: PayloadAction<Level3Step2AnalysisResult>) => {
      state.step2Analysis = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearLevel3State: (state) => {
      state.step2Analysis = null;
      state.isLoading = false;
    },
  },
});

export const { setStep2Analysis, setIsLoading, clearLevel3State } = level3Slice.actions;
export default level3Slice.reducer;

