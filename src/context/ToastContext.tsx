'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastFramer, ToastType } from '@/components/ui/toast-framer';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => addToast(message, 'success'),
    [addToast]
  );
  const error = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, success, error }}>
      {children}
      <div className='pointer-events-none fixed top-4 left-1/2 z-50 flex w-full -translate-x-1/2 flex-col gap-2 p-4 sm:max-w-[420px]'>
        <AnimatePresence mode='popLayout'>
          {toasts.map((toast) => (
            <ToastFramer
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
