// components/ui/Toast.tsx
import React, { useEffect, useState } from 'react';
import type { ToastType } from '../../types.ts';
import XIcon from '../icons/XIcon.tsx';
import CheckIcon from '../icons/CheckIcon.tsx';
import AlertTriangleIcon from '../icons/AlertTriangleIcon.tsx';
import XCircleIcon from '../icons/XCircleIcon.tsx';
import InfoIcon from '../icons/InfoIcon.tsx';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckIcon />,
  error: <XCircleIcon />,
  warning: <AlertTriangleIcon />,
  info: <InfoIcon />,
};

const STYLES: Record<ToastType, { bg: string; text: string; progress: string }> = {
  success: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', progress: 'bg-green-500' },
  error: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', progress: 'bg-red-500' },
  warning: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', progress: 'bg-yellow-500' },
  info: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', progress: 'bg-blue-500' },
};

const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, duration - elapsedTime);
        setProgress((remainingTime / duration) * 100);
        if (remainingTime === 0) {
          clearInterval(timer);
          onDismiss();
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [duration, onDismiss, message]);

  const { bg, text, progress: progressColor } = STYLES[type];

  return (
    <div
      className={`relative flex items-start w-full max-w-sm p-4 rounded-lg shadow-lg overflow-hidden ${bg} ${text} animate-fade-in-right`}
      role="alert"
    >
      <div className="flex-shrink-0 w-6 h-6">{ICONS[type]}</div>
      <div className="ml-3 mr-4 flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="flex-shrink-0">
        <button onClick={onDismiss} className="p-1 rounded-md hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white">
          <XIcon />
        </button>
      </div>
      {duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div className={`${progressColor} h-full`} style={{ width: `${progress}%`, transition: 'width 50ms linear' }}></div>
        </div>
      )}
       <style>{`
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;