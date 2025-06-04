interface ProgressProps {
    totalSteps: number;
    currentStep: number;
  }
  
  export default function ProgressBar({ totalSteps, currentStep }: ProgressProps) {
    return (
      <div className="progress-bar">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={`step-indicator ${index < currentStep ? 'completed' : ''}`}
          />
        ))}
      </div>
    );
  }