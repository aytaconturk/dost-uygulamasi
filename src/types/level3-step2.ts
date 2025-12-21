// Level 3 Step 2 Type Definitions - Reading Speed Improvement Analysis

export interface Level3Step2AnalysisMetrics {
  durationSec: number;
  durationMMSS: string;
  targetWordCount: number;
  spokenWordCount: number;
  matchedWordCount: number;
  accuracyPercent: number;
  wpmSpoken: number;
  wpmCorrect: number;
  wpmTarget?: number;
}

export interface Level3Step2AnalysisOutput {
  userId: string;
  kidName: string;
  title: string;
  hedefOkuma: number; // Target WPM from Level 2
  speedSummary: string;
  reachedTarget: boolean;
  analysisText: string;
  metrics: Level3Step2AnalysisMetrics;
  coachText: string;
  audioBase64?: string;
  transcriptText: string;
  resumeUrl?: string;
}

export interface Level3Step2ApiResponse {
  ok?: boolean;
  output?: Level3Step2AnalysisOutput;
  error?: string;
  // Legacy format support (direct fields)
  userId?: string;
  kidName?: string;
  title?: string;
  [key: string]: any;
}

export interface Level3Step2StepCompletedPayload {
  totalWords: number;
  elapsedSec: number;
  wpm: number;
  targetWPM: number;
  analysis: Level3Step2AnalysisOutput;
  progressDelta?: number; // wpmCorrect - targetWPM
}
