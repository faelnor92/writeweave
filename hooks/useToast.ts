// hooks/useToast.ts
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Toast, ToastProviderProps, ToastType } from '../types.ts';
import ToastComponent from '../components/ui/Toast.tsx';

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return React.createElement(
    'div',
    { className: "fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3" },
    toasts.map((toast) => 
      React.createElement(ToastComponent, {
        key: toast.id,
        message: toast.message,
        type: toast.type,
        onDismiss: () => removeToast(toast.id),
        duration: toast.duration,
      })
    )
  );
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, duration = 4000 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.id = 'toast-portal';
    document.body.appendChild(node);
    setMountNode(node);

    return () => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, []);
  
  const addToast = useCallback((message: string, type: ToastType, toastDuration?: number) => {
    const id = uuidv4();
    const newToast: Toast = { id, message, type, duration: toastDuration || duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  }, [duration]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return React.createElement(
    ToastContext.Provider,
    { value: { addToast, removeToast } },
    children,
    mountNode && createPortal(
      React.createElement(ToastContainer, { toasts: toasts, removeToast: removeToast }),
      mountNode
    )
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast doit être utilisé à l\'intérieur d\'un ToastProvider');
  }
  return context;
};