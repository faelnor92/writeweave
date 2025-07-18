
import React from 'react';

interface PomodoroTimerProps {
  timer: number;
  isActive: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  toggleTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ timer, isActive, mode, toggleTimer, resetTimer, skipTimer }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const modeText = {
      work: 'Travail',
      shortBreak: 'Pause Courte',
      longBreak: 'Pause Longue'
  };

  return (
    <div className="flex items-center gap-4 px-3 py-1">
        <div className="text-center">
             <span className="text-lg font-mono font-semibold text-gray-800 dark:text-white">{formatTime(timer)}</span>
             <p className="text-xs text-gray-500 dark:text-gray-400">{modeText[mode]}</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={toggleTimer} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-md text-sm">
                {isActive ? 'Pause' : 'Start'}
            </button>
            <button onClick={skipTimer} className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-1 px-3 rounded-md text-sm">
                Passer
            </button>
             <button onClick={resetTimer} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-semibold py-1 px-2">
                Reset
            </button>
        </div>
    </div>
  );
};

export default PomodoroTimer;
