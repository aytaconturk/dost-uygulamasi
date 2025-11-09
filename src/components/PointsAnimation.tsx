import { useEffect, useState } from 'react';
import '../styles/points-animation.css';

interface PointsAnimationProps {
  points: number;
  show: boolean;
}

export default function PointsAnimation({ points, show }: PointsAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="points-animation-container">
      <div className="points-animation">
        <div className="stars">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="star" style={{ animationDelay: `${i * 0.1}s` }}>
              ⭐
            </span>
          ))}
        </div>
        <div className="points-text">+{points}</div>
      </div>
    </div>
  );
}
