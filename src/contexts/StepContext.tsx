import { createContext, useContext, ReactNode } from 'react';

interface StepContextType {
  sessionId: string | null;
  storyId: number;
  level: number;
  step: number;
  onStepCompleted?: (completionData?: any) => void;
}

const StepContext = createContext<StepContextType | null>(null);

export function StepProvider({ 
  children, 
  sessionId, 
  storyId, 
  level, 
  step,
  onStepCompleted 
}: { 
  children: ReactNode;
  sessionId: string | null;
  storyId: number;
  level: number;
  step: number;
  onStepCompleted?: (completionData?: any) => void;
}) {
  return (
    <StepContext.Provider value={{ sessionId, storyId, level, step, onStepCompleted }}>
      {children}
    </StepContext.Provider>
  );
}

export function useStepContext() {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useStepContext must be used within StepProvider');
  }
  return context;
}






