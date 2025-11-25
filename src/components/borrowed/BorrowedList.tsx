'use client';

import { useState } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { BorrowedBook, Book } from '@/types/book';
import { isValidImageUrl } from '@/utils/imageUtils';
import GiveReviewModal from '@/components/reviews/GiveReviewModal';

interface BorrowedListProps {
  borrowedBooks: (BorrowedBook & { book?: Book })[];
  onReturn?: (loanId: number) => void;
  isReturning?: boolean;
}

export default function BorrowedList({
  borrowedBooks,
  onReturn,
  isReturning,
}: BorrowedListProps) {
  const router = useRouter();
  const [reviewBookId, setReviewBookId] = useState<number | null>(null);

  if (borrowedBooks.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-md p-12 text-center'>
        <div className='text-6xl mb-4'>📚</div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          No Borrowed Books
        </h2>
        <p className='text-gray-600 mb-6'>
          You haven&apos;t borrowed any books yet.
        </p>
        <button
          onClick={() => router.push('/books')}
          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
        >
          Browse Books
        </button>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {borrowedBooks.map((borrowed) => (
          <div
            key={borrowed.id}
            className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100'
          >
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
              {/* Book Info */}
              <div className='flex-1'>
                <div className='flex items-start gap-4'>
                  {/* Book Cover */}
                  <div className='w-20 h-28 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative'>
                    {isValidImageUrl(borrowed.book?.coverImage) ? (
                      <Image
                        src={borrowed.book!.coverImage!}
                        alt={borrowed.book!.title || 'Book cover'}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='text-4xl text-gray-400'>📚</div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold text-gray-900 mb-2'>
                      {borrowed.book?.title || 'Unknown Book'}
                    </h3>
                    <p className='text-gray-600 mb-2'>
                      Author:{' '}
                      <span className='font-medium'>
                        {borrowed.book?.Author?.name ||
                          borrowed.book?.author ||
                          'Unknown Author'}
                      </span>
                    </p>
                    {borrowed.book?.Category?.name && (
                      <p className='text-sm text-gray-500 mb-3'>
                        <span className='inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded'>
                          {borrowed.book.Category.name}
                        </span>
                      </p>
                    )}
                    <div className='flex flex-wrap gap-4 text-sm text-gray-600 mt-3'>
                      <div>
                        <span className='font-medium'>Borrowed:</span>{' '}
                        {dayjs(borrowed.borrowDate).format('MMM D, YYYY')}
                      </div>
                      <div>
                        <span className='font-medium'>Due Date:</span>{' '}
                        {dayjs(borrowed.dueDate).format('MMM D, YYYY')}
                      </div>
                      {borrowed.returnDate && (
                        <div>
                          <span className='font-medium'>Returned:</span>{' '}
                          {dayjs(borrowed.returnDate).format('MMM D, YYYY')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className='flex flex-col items-end gap-3'>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    borrowed.status === 'RETURNED'
                      ? 'bg-gray-100 text-gray-800'
                      : borrowed.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {borrowed.status}
                </span>

                {borrowed.status === 'BORROWED' && onReturn && (
                  <button
                    onClick={() => onReturn(borrowed.id)}
                    disabled={isReturning}
                    className='px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
                  >
                    {isReturning ? 'Returning...' : 'Return Book'}
                  </button>
                )}

                {borrowed.status === 'RETURNED' && (
                  <button
                    onClick={() =>
                      setReviewBookId(borrowed.bookId || borrowed.book?.id || 0)
                    }
                    className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Give Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Give Review Modal */}
      {reviewBookId !== null && (
        <GiveReviewModal
          bookId={reviewBookId}
          open={true}
          onClose={() => setReviewBookId(null)}
        />
      )}
    </>
  );
}
