'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [returnDate, setReturnDate] = useState<string>('');

  useEffect(() => {
    // Get borrow duration from session
    const durationRaw = sessionStorage.getItem('borrowDuration');
    const duration = durationRaw ? Number(durationRaw) : 3;

    const date = dayjs().add(duration, 'day').format('DD MMMM YYYY');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReturnDate(date);

    // Clear after use
    sessionStorage.removeItem('borrowDuration');
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12'>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        {/* Success Icon */}
        <div className='mb-8'>
          <div className='relative inline-block'>
            <div className='w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse'>
              <svg
                className='w-12 h-12 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={3}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <div className='absolute inset-0 w-24 h-24 border-4 border-blue-200 border-dashed rounded-full animate-ping opacity-20'></div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          Borrowing Successful!
        </h1>
        <p className='text-lg text-gray-600 mb-8'>
          Your book(s) have been successfully borrowed. Please return{' '}
          <span className='font-bold text-red-600'>{returnDate}</span>.
        </p>

        {/* Action Button */}
        <button
          onClick={() => router.push('/borrowed')}
          className='px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors'
        >
          See Borrowed List
        </button>
      </div>
    </div>
  );
}
