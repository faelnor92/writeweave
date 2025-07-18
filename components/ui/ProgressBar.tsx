// components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 à 100
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = 'h-2' }) => {
  const sanitizedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300 ease-linear"
        style={{ width: `${sanitizedProgress}%` }}
        aria-valuenow={sanitizedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      ></div>
    </div>
  );
};

export default ProgressBar;