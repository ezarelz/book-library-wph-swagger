'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const toastVariants = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

export function ToastFramer({ id, message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial='initial'
      animate='animate'
      exit='exit'
      className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg ${
        type === 'success'
          ? 'border-green-100 bg-white text-green-800'
          : 'border-red-100 bg-white text-red-800'
      }`}
    >
      <div className='shrink-0'>
        {type === 'success' ? (
          <CheckCircle className='h-5 w-5 text-green-500' />
        ) : (
          <AlertCircle className='h-5 w-5 text-red-500' />
        )}
      </div>
      <p className='flex-1 text-sm font-medium'>{message}</p>
      <button
        onClick={() => onClose(id)}
        className='shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500'
      >
        <X className='h-4 w-4' />
      </button>
    </motion.div>
  );
}
